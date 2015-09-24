/**
 * Author: Massimo Candela
 * Date: 05/09/2015
 * Please refer to LICENSE.txt for information about the license.
 */

define(
    [
        //Template
        BGPLAY_TEMPLATES_NOCORS_URL + "aboutBgplay.html.js"

    ],  function(){


        var AboutBgplayView = Backbone.View.extend({

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
                this.button = $('<a class="button" href="javascript:void(0);">About BGPlay</a>');
                this.popup = $('<div class="about-bgplay popup"><h3>About BGPlay</h3></div>');
                parseTemplate(this.environment, 'aboutBgplay.html', this, this.popup, "append");
                this.popup.hide();

                this.footerDiv.find('.left').append(this.button);
                this.footerDiv.append(this.popup);

                return this;
            },

            /**
             * This method manages the events of the built DOM.
             * @method eventManager
             */
            eventManager:function(){
                var $this=this;
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

        return AboutBgplayView;
    });