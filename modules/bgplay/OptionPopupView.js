/*
 * BGPlay.js
 * Copyright (c) 2013 Massimo Candela, Giuseppe Di Battista, Claudio Squarcella, Roma Tre University and RIPE NCC
 * http://www.bgplayjs.com
 *
 * See the file LICENSE.txt for copying permission.
 */

/**
 * OptionPopupView draws a panel which allows the user to graphically manage options
 * @class OptionPopupView
 * @module modules
 */

define(
    [
        //Template
        BGPLAY_TEMPLATES_NOCORS_URL + "options.html.js"

    ],  function(){

        var OptionPopupView = Backbone.View.extend({

            /*
             * The initialization method of this object.
             * @method initialize
             * @param {Map} A map of parameters
             */
            initialize: function(){
                this.environment = this.options.environment;
                this.bgplay = this.environment.bgplay;
                this.fileRoot = this.environment.fileRoot;
                this.eventAggregator = this.environment.eventAggregator;



                this.eventAggregator.on("destroyAll", function(){
                    this.destroyMe();
                },this);

                this.render();
                this.eventManager();
                this.eventAggregator.trigger("moduleLoaded", this);
            },

            /**
             * This method draws this module (eg. inject the DOM and elements).
             * @method render
             */
            render: function(){
                this.footerDiv = this.environment.dom.find('.bgplayjsButtonsDiv');
                this.button = $('<a class="button" href="javascript:void(0);">options</a>');
                this.popup = $('<div class="popup">Options</div>');
                parseTemplate(this.environment,'options.html', this,this.popup,"append");
                this.popup.hide();
                this.footerDiv.find('.left').append(this.button);
                this.footerDiv.append(this.popup);
                this.environment.optionPopupDom = this.popup.find('.bgplayOptionsPopup');
                return this;
            },

            /**
             * This method manages the events of the built DOM.
             * @method eventManager
             */
            eventManager: function(){
                var $this = this;
                this.button.click(function(){
                    if ($this.popup.is(':visible')){
                        $this.popup.hide();
                    }else{
                        $this.footerDiv.find('.popup').hide();
                        $this.popup.show();
                    }
                });
            }
        });
        return OptionPopupView;
    });