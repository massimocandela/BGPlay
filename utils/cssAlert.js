/*
 * BGPlay.js
 * Copyright (c) 2013 Massimo Candela, Giuseppe Di Battista, Claudio Squarcella, Roma Tre University and RIPE NCC
 * http://www.bgplayjs.com
 *
 * See the file LICENSE.txt for copying permission.
 */

/*
 * Jquery is needed
 */

var cssAlert = function(rootDom, alertPrefix, width){
    this.rootDom = rootDom;
    this.alertPrefix = alertPrefix;
    this.width = Math.min(400,(width/100)*80);

    if (!this.rootDom.find('.'+this.alertPrefix+'SuccessAlert').length){
        this.rootDom.append('<div class="'+this.alertPrefix+'InfoAlert"></div>' +
            '<div class="'+this.alertPrefix+'ErrorAlert"></div>' +
            '<div class="'+this.alertPrefix+'ValidationAlert"></div>' +
            '<div class="'+this.alertPrefix+'WarningAlert"></div>' +
            '<div class="'+this.alertPrefix+'SuccessAlert"></div>');

        this.successDiv = this.rootDom.find('.'+this.alertPrefix+'SuccessAlert');
        this.validationDiv = this.rootDom.find('.'+this.alertPrefix+'ValidationAlert');
        this.warningDiv = this.rootDom.find('.'+this.alertPrefix+'WarningAlert');
        this.errorDiv = this.rootDom.find('.'+this.alertPrefix+'ErrorAlert');
        this.infoDiv = this.rootDom.find('.'+this.alertPrefix+'InfoAlert');
    }

    this.confirm = function(text, callbackTrue, callbackFalse, initialDelay){
        var buttons, positive, negative, alertDiv;
        alertDiv = this.warningDiv;
        positive = $('<input type="button" value="Yes"/>');
        negative = $('<input type="button" value="No"/>');
        buttons = $('<div style="width:100%; height:20px; text-align:right;"></div>');

        buttons.append(positive);
        buttons.append(negative);

        positive.bind('click', function(){
            alertDiv.hide();
        });
        negative.bind('click', function(){
            alertDiv.hide();
        });

        positive.bind('click', callbackTrue);
        negative.bind('click', callbackFalse);

        alertDiv.html(text).css("width",this.width+"px").css("margin-left",-(this.width/2) - 32 + "px").delay(initialDelay).fadeIn(500).append(buttons);
    },

        this.alert = function(text,type,initialDelay){
            var initialDelay, alertDiv;
            initialDelay = initialDelay || 0;
            switch(type){
                case "success":
                    alertDiv = this.successDiv;
                    break;
                case "validation":
                    alertDiv = this.validationDiv;
                    break;
                case "warning":
                    alertDiv = this.warningDiv;
                    break;
                case "error":
                    alertDiv = this.errorDiv;
                    break;
                default:
                    alertDiv = this.infoDiv;
                    break;
            }

            if (isMobileBrowser()==true){
                //alert(text);
            }else{
                alertDiv.html(text).css("width",this.width+"px").css("margin-left",-(this.width/2) - 32 + "px").delay(initialDelay).fadeIn(500).delay(2000).fadeOut(1000);
            }
        }
}
