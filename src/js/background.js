let locale = navigator.language;
let request = new XMLHttpRequest();
let savedQuestions = browser.storage.local.get('questions');
savedQuestions.then(loaded);
var requestAPI = "";
var numberOfQuestionsOpened = 0;

// settings to search questions using the Kitsune API
var product = "Firefox";
var is_solved = "False";
var is_spam = "False";
var is_locked = "False";
var is_taken = "False";
var is_archived = "False";

// popup menu
var refresh = document.getElementById('refresh');
var openTab = document.getElementById('open_tab');
var load = document.getElementById('load');
var empty = document.getElementById('empty');
var questions = document.getElementById('questions');
var clear = document.getElementById('clear');
var questionOpened = '';

// title i18n
clear.title = browser.i18n.getMessage("clear_notifications");
refresh.title = browser.i18n.getMessage("refresh");

// Event Listener
clear.addEventListener('click', function(){
    clearNotifications();
}, false);

refresh.addEventListener('click', function(){
    location.reload();
}, false);

// automatically refresh
browser.alarms.create('checkSUMO',{delayInMinutes:15}); // checks every 15 minutes
browser.alarms.onAlarm.addListener(function(){
    request.onload();
});

function initAPICall() {
    // request for questions not solved, not spam, not locked, product Firefox, not taken, not archived
    // and using the language based of the Firefox used
    requestAPI = "https://support.mozilla.org/api/2/question/?format=json&ordering=-id&is_solved="+is_solved+"&is_spam="+
                is_spam+"&is_locked="+is_locked+"&product="+product+"&is_taken="+is_taken+"&is_archived="+is_archived+"&locale="+locale,
    request.open('GET', requestAPI, true);
    request.responseType = 'json';
    request.send();
}

// runs when the browser loads the saved questions
function loaded(data) {
    if (data.questions) {
        savedQuestions = data.questions;
        cleanData();
    } else {
        savedQuestions = [];
    }
    initAPICall();
}

// cleans old data from the browser storage
function cleanData() {
    var numItems = savedQuestions.length;
    for (var i = 0; i < numItems; i++) {
        if (savedQuestions[i].timestamp < Date.now() - 86400000) {
            savedQuestions.splice(i,1);
        }
    }

    // checks if storage write is necessary
    if (savedQuestions.length != numItems) {
        browser.storage.local.set({'questions':newQuestionList});
    }
}

// search for new questions
request.onload = function() {
        var responseSUMO = request.response;
        var newQuestionList = [];
        for(var i = 0; i < 20; i++){
            if(responseSUMO.results[i].num_answers == 0){
                for(var j = 0; j < responseSUMO.results[i].tags.length; j++){
                    if(responseSUMO.results[i].tags[j].name == "desktop" && responseSUMO.results[i].tags[j].slug == "desktop"){
                        numberOfQuestionsOpened = numberOfQuestionsOpened + 1;
                        // saves the number of questions opened
                        localStorage.setItem('numberOfQuestionsOpened', numberOfQuestionsOpened);

                        // url of the question
                        var url = "https://support.mozilla.org/"+locale+"/questions/"+responseSUMO.results[i].id;

                        // create elements
                        var questionOrder = document.createElement("div");
                        var questionTitle = document.createElement("label");
                        var iconProduct = document.createElement("img");
                        var zeroDiv = document.createElement("div");
                        var firstDiv = document.createElement("div");
                        var secondDiv = document.createElement("div");
                        var buttonOpen = document.createElement("a");
                        var section = document.querySelector("section");
                        var container = document.createElement("div");
                        var verticalContainer = document.createElement("div");
                        var spacer = document.createElement("div");

                        //
                        zeroDiv.className = "col-md-12 margin-and-top-distance";
                        firstDiv.className = "col-md-12 margin-and-top-distance";
                        secondDiv.className = "panel-section-separator"
                        questionTitle.className = "text-justify question-settings";
                        questionTitle.textContent = responseSUMO.results[i].title;
                        iconProduct.className = "icon-size-and-distance";
                        iconProduct.title = browser.i18n.getMessage("firefox_for_desktop");
                        iconProduct.src = "../res/icons/firefox.png";
                        buttonOpen.className = "btn btn-primary btn-settings";
                        buttonOpen.text = browser.i18n.getMessage("open_tab");
                        buttonOpen.href = url;
                        container.className = "question-container";
                        verticalContainer.className = "vertical-container";

                        //
                        var verticalContainer2 = verticalContainer.cloneNode(true);
                        var spacer2 = spacer.cloneNode(true);
                        var spacer3 = spacer.cloneNode(true);
                        var spacer4 = spacer.cloneNode(true);

                        //
                        questionOrder.appendChild(zeroDiv);

                        container.appendChild(verticalContainer);
                        verticalContainer.appendChild(spacer);
                        verticalContainer.appendChild(iconProduct);
                        verticalContainer.appendChild(spacer2);

                        container.appendChild(questionTitle);

                        container.appendChild(verticalContainer2);
                        verticalContainer2.appendChild(spacer3);
                        verticalContainer2.appendChild(buttonOpen);
                        verticalContainer2.appendChild(spacer4);

                        questionOrder.appendChild(container);
                        questionOrder.appendChild(firstDiv);
                        questionOrder.appendChild(firstDiv);
                        questionOrder.appendChild(secondDiv);

                        section.appendChild(questionOrder);

                        var x = 0;
                        var questionExists = false;
                        while (x < savedQuestions.length && !questionExists) {
                            questionExists = (url == savedQuestions[x].url);
                            x++;
                        }

                        if (!questionExists) {
                            var newItem = {
                                product: 'firefox_for_desktop',
                                title: responseSUMO.results[i].title,
                                url: url,
                                timestamp: Date.now(),
                                new: true
                            }
                            newQuestionList.push(newItem);
                            console.log("Saved" + url);
                        }
                    }
                }
            }
        }
    
        savedQuestions = newQuestionList.concat(savedQuestions);
        browser.storage.local.set({'questions':savedQuestions});

        // number of questions opened
        console.log("Questions opened = "+numberOfQuestionsOpened);

        // verifies if have any questions opened
        if(localStorage.getItem('numberOfQuestionsOpened') >= 1){
            browser.browserAction.setBadgeText({text: localStorage.getItem('numberOfQuestionsOpened')});
            questions.style.display = "block";
            load.style.display = "none";
            empty.style.display = "none";
        }else{
            browser.browserAction.setBadgeText({text: ''});
            empty.style.display = "block";
            load.style.display = "none";
            questions.style.display = "none";
        }

        // changes the title
        if(localStorage.getItem('numberOfQuestionsOpened') >= 2){
            browser.browserAction.setTitle({title: localStorage.getItem('numberOfQuestionsOpened')+browser.i18n.getMessage("more_than_one_question_without_answer")});
        }else if (localStorage.getItem('numberOfQuestionsOpened') == 1){
            browser.browserAction.setTitle({title: localStorage.getItem('numberOfQuestionsOpened')+browser.i18n.getMessage("one_question_without_answer")});
        }else{
            browser.browserAction.setBadgeText({text: ''});
        }

        // clears the number of questions
        numberOfQuestionsOpened = 0;
}

// clears the notification and sets the title
function clearNotifications() {
  browser.browserAction.setBadgeText({text: ''});
  browser.browserAction.setTitle({title: localStorage.getItem('extensionName')});
}