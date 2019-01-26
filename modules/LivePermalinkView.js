/*
 * BGPlay.js
 * Copyright (c) 2013 Massimo Candela, Giuseppe Di Battista, Claudio Squarcella, Roma Tre University and RIPE NCC
 * http://bgplayjs.com
 *
 * See the file LICENSE.txt for copying permission.
 */

/**
 * LivePermalinkView provides a dynamic permalink composed of parameters changed due to user interaction.
 * @class LivePermalinkView
 * @module modules
 */
var LivePermalinkView=Backbone.View.extend({

    /**
     * The initialization method of this object.
     * @method initialize
     * @param {Map} A map of parameters
     */
    initialize:function(){
        this.environment=this.options.environment;
        this.bgplay=this.environment.bgplay;
        this.fileRoot=this.environment.fileRoot;
        this.eventAggregator=this.environment.eventAggregator;



        this.positions="";
        this.eventAggregator.on("destroyAll", function(){
            this.destroyMe();
        },this);
        this.render();
        this.eventManager();
        this.managePermalink();

        this.bgplay.on("change:cur_instant",function(){
            this.managePermalink();
        },this);

        this.eventAggregator.trigger("moduleLoaded", this);
    },

    /**
     * This method draws this module (eg. inject the DOM and elements).
     * @method render
     */
    render:function(){
        var statWidget = this.environment.dom.closest('.stat-widget');
        this.permalinkPopup = statWidget.find('.permalink');
        this.permalinkPopup.append('<div style="width:120px;height:15px;position:absolute;bottom:50px;right:20px;"><input style="width:15px;" type="checkbox" name="liveCheck" value="0"/>Dynamic URL</div>');
        this.liveCheck = this.permalinkPopup.find('input[name=liveCheck]');
        this.permalinkField = this.permalinkPopup.children('input');

        return this;
    },

    /**
     * This method manages the events of the built DOM.
     * @method eventManager
     */
    eventManager:function(){
        var $this=this;

        this.liveCheck.click(function(){
            $this.managePermalink();
        });
    },

    /**
     * This method dispatches the computation of permalinks.
     * @method eventManager
     */
    managePermalink:function(){
        if (this.permalinkPopup.is(':visible')){
            if (this.liveCheck.is(':checked')){
                this.permalinkField.val(this.generateDynamicPermalink(this.environment.jsonWrap.setParams(this.environment.params)));
            }else{
                if (this.staticPermalink==null){
                    this.staticPermalink = this.generateStaticPermalink(this.environment.jsonWrap.setParams(this.environment.params));
                }
                this.permalinkField.val(this.staticPermalink );
            }
        }
    },

    /**
     * This method computes dynamic permalinks.
     * @method generateDynamicPermalink
     */
    generateDynamicPermalink:function(params) {
        var out = "";
        for (var key in params) {
            if (!arrayContains(this.environment.optionalParams,key)){
                out += "w." + key + "=" + params[key]+"&";
            }
        }
        return STAT_HOME + 'widget/bgplay#' + out.slice(0, -1);
    },

    /**
     * This method computes static permalinks.
     * @method generateStaticPermalink
     */
    generateStaticPermalink:function(params) {
        var out = "";
        for (var key in params) {
            if (!arrayContains(this.environment.optionalParams,key) && !arrayContains(this.environment.dynamicParams,key)){
                out += "w." + key + "=" + params[key]+"&";
            }
        }
        return STAT_HOME + 'widget/bgplay#' + out.slice(0, -1);
    }
});