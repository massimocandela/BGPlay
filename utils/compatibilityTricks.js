/*
 * BGPlay.js
 * Copyright (c) 2013 Massimo Candela, Giuseppe Di Battista, Claudio Squarcella, Roma Tre University and RIPE NCC
 * http://bgplayjs.com
 *
 * See the file LICENSE.txt for copying permission.
 */


String.prototype.trimEnd = function (c) {
    if (c)
        return this.replace(new RegExp(c.escapeRegExp() + "*$"), '');
    return this.replace(/\s+$/, '');
};

String.prototype.trimStart = function (c) {
    if (c)
        return this.replace(new RegExp("^" + c.escapeRegExp() + "*"), '');
    return this.replace(/^\s+/, '');
};

String.prototype.escapeRegExp = function() {
    return this.replace(/[.*+?^${}()|[\]\/\\]/g, "\\$0");
};

/*
if ( !Array.prototype.removeSubArray ) {
    Array.prototype.removeSubArray = function (array) {
        var n, i, inarray;
        var tmp=[];
        for (n = 0; n < this.length; n++) {
            inarray=false;
            for (i = 0; i < array.length; i++) {
                if (array[i]==this[n]){
                    inarray=true;
                    break;
                }
            }
            if (inarray==false)
                tmp.push(this[n]);
        }
        return tmp;
    };
}

if ( !Array.prototype.remove ) {
    Array.prototype.remove=function(element){
        return this.removeSubArray([element]);
    }
}

if ( !Array.prototype.forEach ) {
    Array.prototype.forEach = function(fn, scope) {
        for(var i = 0, len = this.length; i < len; ++i) {
            fn.call(scope, this[i], i, this);
        }
    }
};

if ( !Array.prototype.join ) {
    Array.prototype.join = function(char) {
        var out="";
        for(var i = 0, len = this.length; i < len-1; i++) {
            out+=this[i]+char;
        }
        out+=this[i+1];
        return out;
    }
};

if ( !Array.prototype.contains ) {
    Array.prototype.contains = function(element) {
        var len=this.length;
        for(var i = len; i--;) {
            if (this[i]==element)
                return true;
        }
        return false;
    };
}

Array.prototype.containsById = function(element) {
    var len=this.length;
    for(var i =len; i--;) {
        if (this[i].id==element.id)
            return true;
    }
    return false;
};
*/
var toType = function(obj) {
    return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase();
}

proto = window.CanvasRenderingContext2D ? window.CanvasRenderingContext2D.prototype : document.createElement('canvas').getContext('2d').__proto__;

if(proto.mozMeasureText && !proto.measureText) {
    proto.__defineSetter__('font', function(x) { this.mozTextStyle = x;});
    proto.__defineGetter__('font', function() { return this.mozTextStyle;});
}
if(proto.mozMeasureText && !proto.measureText) {
    proto.measureText = function(text) { return {'width': this.mozMeasureText(text)}; };
}
if(proto.mozPathText && !proto.strokeText) {
    proto.strokeText = function(text, x, y) {
        this.translate(x, y);
        this.mozPathText(text);
        this.stroke();
        this.translate(-x, -y);
    };
}
if(proto.mozDrawText && !proto.fillText) {
    proto.fillText = function(text, x, y) {
        this.translate(x, y);
        this.mozDrawText(text);
        this.translate(-x, -y);
    };
}

function eventStopPropagation(event){
    try{
        event.stopPropagation();
    }catch(e){
        try{
            window.event.cancelBubble=true;
        }catch(e){
        }
    }
}