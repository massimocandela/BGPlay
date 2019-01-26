/*
 * BGPlay.js
 * Copyright (c) 2013 Massimo Candela, Giuseppe Di Battista, Claudio Squarcella, Roma Tre University and RIPE NCC
 * http://bgplayjs.com
 *
 * See the file LICENSE.txt for copying permission.
 */

/**
 * FullScreenView provides a full-screen visualization
 * @class FullScreenView
 * @module modules
 */
var FullScreenView=Backbone.View.extend({
    events:{
        "click":"fullscreen"
    },

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



        this.eventAggregator.on("destroyAll", function(){
            this.destroyMe();
        },this);

        this.eventAggregator.trigger("moduleLoaded", this);
    },

    /**
     * This method opens the full-screen view
     * @method fullscreen
     */
    fullscreen:function(event){
        var uriContent="";
        var instant=this.bgplay.get("cur_instant");

        uriContent = setUrlParam("unix_timestamps","TRUE",false, uriContent);
        uriContent = setUrlParam("starttime",this.environment.params.starttimestamp,false, uriContent);
        uriContent = setUrlParam("endtime",this.environment.params.endtimestamp,false, uriContent);
        uriContent = setUrlParam("resource",this.environment.params.targets,false, uriContent);
        uriContent = setUrlParam("ignoreReannouncements", this.environment.params.ignoreReannouncements, false, uriContent);
        uriContent = setUrlParam("instant",instant.get("id")+','+instant.get("timestamp"),false, uriContent);
        uriContent = setUrlParam("selectedRrcs",this.environment.params.selectedRrcs,false, uriContent);

        window.open(this.environment.fullScreenVersionPosition + uriContent, 'BGPlay');
    }
});