/*
 * BGPlay.js
 * Copyright (c) 2013 Massimo Candela, Giuseppe Di Battista, Claudio Squarcella, Roma Tre University and RIPE NCC
 * http://bgplayjs.com
 *
 * See the file LICENSE.txt for copying permission.
 */

/**
 * OptionAnimationSpeedView pushes in the option panel the animation speed control
 * @class OptionAnimationSpeedView
 * @module modules
 */

define(
    [
        //Template
        BGPLAY_TEMPLATES_NOCORS_URL + "optionPeerFilter.html.js"

    ],  function(){

        var OptionPeerFilter = Backbone.View.extend({

            /*
             * The initialization method of this object.
             * @method initialize
             * @param {Map} A map of parameters
             */
            initialize:function(){
                this.environment = this.options.environment;
                this.bgplay = this.environment.bgplay;
                this.fileRoot = this.environment.fileRoot;
                this.eventAggregator = this.environment.eventAggregator;

                this.eventAggregator.on("destroyAll", function(){
                    this.destroyMe();
                },this);

                this.dom  =  this.environment.optionPopupDom;
                this.render();
                this.eventAggregator.trigger("moduleLoaded", this);
            },

            /**
             * This method draws this module (eg. inject the DOM and elements).
             * @method render
             */
            render: function(){
                var $this, peers;
                $this  =  this;

                parseTemplate(this.environment, 'optionPeerFilter.html', this.environment.params, this.dom, "prepend");

                peers  =  this.dom.find('.cpFilter');

                peers.on("click change keyup", function () {
                    console.log("hereee");
                    var value = $(this).val().split(",")
                        .map(function(item){
                            return item.trim();
                        });
                    $this.eventAggregator.trigger('filteredPeerChanged', (value.length && value[0] != "") ? value : "all");
                });



                return this;
            }
        });

        return OptionPeerFilter;
    });