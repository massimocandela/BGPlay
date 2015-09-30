/*
 * BGPlay.js
 * Copyright (c) 2013 Massimo Candela, Giuseppe Di Battista, Claudio Squarcella, Roma Tre University and RIPE NCC
 * http://www.bgplayjs.com
 *
 * See the file LICENSE.txt for copying permission.
 */

window.currentUrl = document.location.search;
window.isMobile;
window.templateCache = window.templateCache || {};

function getAmountOfTime(timestamp){
    var amount = {};

    amount.days = Math.floor(timestamp/86400); //86400sec = 1 day
    var tmpSec=(timestamp%86400);
    amount.hours =Math.floor(tmpSec/3600); //3600sec = 1 hour
    tmpSec=(timestamp%86400)%3600;
    amount.minutes=Math.floor(tmpSec/60);
    amount.seconds=tmpSec%60;

    return amount;
}

function stringToArray(str){ //A level of indirection useful if you want to change the splitting/joining char
    return str.split(",");
}

function arrayToString(string, symbol){
    var symbol = symbol || ',';
    if (Array.prototype.join) {
        return string.join(symbol);
    }else{
        var out="";
        for(var i = 0, len = this.length; i < len-1; i++) {
            out+=this[i]+symbol;
        }
        out+=this[i+1];
        return out;
    }
}

function reverseArray(array){
    var out, n, length;
    out = [];
    length = array.length;
    for (n=length-1; n>=0; n--){
        out.push(array[n]);
    }
    return out;
}

function toRadians (angle) {
    return angle * (Math.PI / 180);
}

function lineIntersect(x1,y1,x2,y2, x3,y3,x4,y4) {
    var x = ((x1*y2-y1*x2)*(x3-x4)-(x1-x2)*(x3*y4-y3*x4))/((x1-x2)*(y3-y4)-(y1-y2)*(x3-x4));
    var y = ((x1*y2-y1*x2)*(y3-y4)-(y1-y2)*(x3*y4-y3*x4))/((x1-x2)*(y3-y4)-(y1-y2)*(x3-x4));
    return {x:x, y:y};
}

function segmentIntersect(x1,y1,x2,y2, x3,y3,x4,y4) {
    var x, y , attenuation = 0.1;

    attenuation = 0.1;
    x = ((x1*y2-y1*x2)*(x3-x4)-(x1-x2)*(x3*y4-y3*x4))/((x1-x2)*(y3-y4)-(y1-y2)*(x3-x4));
    y = ((x1*y2-y1*x2)*(y3-y4)-(y1-y2)*(x3*y4-y3*x4))/((x1-x2)*(y3-y4)-(y1-y2)*(x3-x4));

    if (isNaN(x)||isNaN(y)) {
        return false;
    }
    if ((x>=(Math.min(x1, x2)-attenuation) && x<=(Math.max(x1,x2)+attenuation)) && (y>=(Math.min(y1, y2)-attenuation) && y<=(Math.max(y1,y2)+attenuation))
        && (x>=(Math.min(x3, x4)-attenuation) && x<=(Math.max(x3,x4)+attenuation)) && (y>=(Math.min(y3, y4)-attenuation) && y<=(Math.max(y3,y4)+attenuation))){
        return {x: x, y: y};
    }

    return false;
}


function getUrlParam(name) {
    var match = new RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search);
    return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
}

function log(text){
    try{ //To avoid errors with browsers without console
        if (debugMode==true){
            console.log((new Date()).toString()+": "+text);
        }
    }catch(e){
        //Don't do nothing
    }
}

function needed(name,obj){
    if (obj==null){
        alert("The following parameters are required: "+name);
    }
}

//This function uses Mustache.js to parse a template file and returns or directly injects the resulting DOM
function parseTemplate(environment, template, object, where, method){
    var templateFile = environment.templateRoot + "js_nocors/" + template +'.js';
    if (where == null)
        alert("DOM is null: " + template);

    var tplResult = window.templateCache[template]; //try in cache
    if (tplResult == null){
        $.ajax({
            async: false,
            url: templateFile,
            type: 'GET',
            success: function(tpl) {
                tplResult = tpl;
                window.templateCache[template] = tplResult;
            }
        });
    }

    if (method=="append"){
        $(where).append(Mustache.to_html(tplResult, object));
    }if (method=="prepend"){
        $(where).prepend(Mustache.to_html(tplResult, object));
    }else{
        $(where).html(Mustache.to_html(tplResult, object));
    }
}


var addOffset = function (event, element, forced) {
    var element = element || $(event.target);
    var offset = $(element).offset();
    if (!event.offsetX || forced) {
        event.offsetX = (event.pageX - offset.left);
        event.offsetY = (event.pageY - offset.top);
    }
    return event;
};

function roundTo(decimalpositions){
    var i = this * Math.pow(10,decimalpositions);
    i = Math.round(i);
    return i / Math.pow(10,decimalpositions);
}
Number.prototype.roundTo = roundTo;

var dateToString=function(timestamp){ //This is an indirection, may be useful in the future to manipulate dates
    return dateToUTC(timestamp).format("yyyy-mm-dd HH:MM:ss");
}

function dateToUTC(timestamp){
    var date = new Date(timestamp*1000);
    return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(),  date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds());
}


var isInternetExplorer=function(){
    var version, re, ua;
    version = -1;
    if (navigator.appName == 'Microsoft Internet Explorer'){
        ua = navigator.userAgent;
        re  = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");
        if (re.exec(ua) != null){
            version = parseFloat( RegExp.$1 );
        }
    }
    return version;
}

function isMobileBrowser(){
    if (window.isMobile==null){
        if ( /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent) ) {
            window.isMobile = true;
        }else{
            window.isMobile = false;
        }
    }
    return window.isMobile;
}

function makeUnselectable(node) {
    if (node.nodeType == 1) {
        node.setAttribute("unselectable", "on");
        try{
            node.style.userSelect = "none";
            node.style.webkitUserSelect = "none";
            node.style.MozUserSelect = "none";
        }catch(e){
        }
    }
    var child = node.firstChild;
    while (child) {
        makeUnselectable(child);
        child = child.nextSibling;
    }
}

function rotateTextInElement(titleElement){
    var titleText, i, length;

    titleText= titleElement.html();
    titleElement.html("");
    for (i = 0, length=titleText.length; i < length; i++) {
        titleElement.append(titleText.charAt(i)+"<br/>");
    }
    titleElement.css("text-align", "center");
}

Backbone.View.prototype.destroyMe=function(){
    try{
        this.unbind();
    }catch(e){
    }

    try{
        this.remove();
    }catch(e){
    }

    try{
        this.model.unbind( 'change', this.render, this );
    }catch(e){
    }

    try{
        delete this.$el;
        delete this.el;
    }catch(e){
    }
}

function areMapsEquals(map1, map2, excludedKey){
    for (var key in map1) {
        if ((excludedKey == null || !arrayContains(excludedKey, key)) && map1[key] != map2[key]){
            return false;
        }
    }
    return true;
}

function arrayContains(array, element){
    for (var i = 0, length = array.length; i<length; i++){
        if (array[i]==element)
            return true;
    }
    return false;
}

function arrayContainsAll(array1, array2){
    var i, element, length;
    for (i = 0, length = array2.length; i<length; i++){
        element = array2[i];
        if (!arrayContains(array1, element)){
            return false;
        }
    }
    return true;
}

function arrayContainsOne(array1, array2){
    var i, element, length;
    for (i = 0, length = array2.length; i<length; i++){
        element = array2[i];
        if (arrayContains(array1, element)){
            return true;
        }
    }
    return false;
}

function removeSubArray(mainArray, subArray){
    var n, i, inarray, length1, length2;
    var tmp=[];
    for (n = 0, length1=mainArray.length; n < length1; n++) {
        inarray=false;
        for (i = 0, length2 = subArray.length; i < length2; i++) {
            if (subArray[i]==mainArray[n]){
                inarray=true;
                break;
            }
        }
        if (inarray==false)
            tmp.push(mainArray[n]);
    }
    return tmp;
}

function removeArrayElement(mainArray, element){
    return removeSubArray(mainArray, [element]);
}

function printLoadingInformation(environment,log){
    var domElement;
    domElement = environment.bgplayDom.find('.bgplayLoadingInformation');

    if (domElement.length!=0){
        domElement.remove();
    }

    domElement = $('<div class="bgplayLoadingInformation">' +
        '<div class="loadingLog"></div>' +
        '</div>');
    environment.bgplayDom.prepend(domElement);

    if (log==""){
        domElement.hide();
    }else{
        domElement.find('.loadingLog').html(log);
        domElement.show();
    }
}

var globalSVGIndex = new net.webrobotics.TreeMap(comparator, {allowDuplicateKeys:true, suppressDuplicateKeyAlerts:true});

function setSVGIndex(element, index){
    globalSVGIndex.removeValue(element);
    globalSVGIndex.put(index, element);

    globalSVGIndex.forEach(function(svgElement){
        svgElement.toFront();
    });
}

function loadCss(css_url){
    $("head").append($('<link rel="stylesheet" href="' + css_url + '" type="text/css"/>'));
}

function isFunction(functionToCheck){
    var getType = {};
    return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
}


//Workaround for not CORS enabled web server
function addTemplateContent(name, template){
    window.templateCache = window.templateCache || {};
    window.templateCache[name] = template;
}


navigator.browser = (function(){
    var userAgent, appName, matched, tem;
    userAgent = navigator.userAgent;
    appName = navigator.appName;
    matched = userAgent.match(/(opera|chrome|safari|firefox|msie|trident|Windows Phone|BlackBerry|Opera Mini|IEMobile|iPhone|iPad|iPod|webOS|Android)\/?\s*([\d\.]+)/i) || [];
    matched = matched[2]? [matched[1], matched[2]]:[appName, navigator.appVersion, '-?'];
    if(matched && (tem = userAgent.match(/version\/([\.\d]+)/i)) != null) matched[2] = tem[1];
    return {name: matched[0], version: matched[1].split('.')};
})();


var checkCompatibility = function(compatibilityList){
    var detectedBrowser, detectedVersion, matchedEntry, declaredVersionCompatibility, matchedEntryName;

    detectedBrowser = navigator.browser.name.toLowerCase();
    detectedVersion = navigator.browser.version;

    for (var entry in compatibilityList){
        matchedEntry = compatibilityList[entry];
        matchedEntryName = matchedEntry["browserName"].toLowerCase();

        if (matchedEntryName == detectedBrowser){

            declaredVersionCompatibility = matchedEntry["version"].split('.');

            switch(matchedEntry["comparator"]){
                case "<":
                    for (var n=0,length=Math.min(declaredVersionCompatibility.length, detectedVersion.length); n<length; n++){
                        if (parseInt(detectedVersion[n]) < parseInt(declaredVersionCompatibility[n])){
                            return false;
                        }
                    }
                    break;

                case ">":
                    for (var n=0,length=Math.min(declaredVersionCompatibility.length, detectedVersion.length); n<length; n++){
                        if (parseInt(detectedVersion[n]) > parseInt(declaredVersionCompatibility[n])){
                            return false;
                        }
                    }
                    break;

                case "=":
                    for (var n=0,length=Math.min(declaredVersionCompatibility.length, detectedVersion.length); n<length; n++){
                        if (parseInt(detectedVersion[n]) == parseInt(declaredVersionCompatibility[n])){
                            return false;
                        }
                    }
                    break;
            }
        }
    }
    return true;
};