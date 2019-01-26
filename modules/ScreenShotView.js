/*
 * BGPlay.js
 * Copyright (c) 2013 Massimo Candela, Giuseppe Di Battista, Claudio Squarcella, Roma Tre University and RIPE NCC
 * http://bgplayjs.com
 *
 * See the file LICENSE.txt for copying permission.
 */

/**
 * ScreenShotView opens in a new tab the SVG representation of the graph.
 * @class ScreenShotView
 * @module modules
 */
var ScreenShotView=Backbone.View.extend({
    events:function(){
        return {
            "click":"screenshot"
        }
    },

    /**
     * The initialization method of this object.
     * @method initialize
     * @param {Map} A map of parameters
     */
    initialize:function(){
        var ie = isInternetExplorer();
        if (ie==-1 || ie >9){
            this.environment=this.options.environment;
            this.bgplay=this.environment.bgplay;
            this.fileRoot=this.environment.fileRoot;
            this.eventAggregator=this.environment.eventAggregator;



            this.eventAggregator.on("destroyAll", function(){
                this.destroyMe();
            },this);
            this.eventAggregator.trigger("moduleLoaded", this);
        }else{
            this.$el.css("opacity","0.5");
            this.$el.click(function(event){
                alert("Not supported by this browser!");
            });
        }
    },

    /**
     * This method opens in a new tab an SVG file containing the graph
     * @method screenshot
     */
    screenshot:function(event){
        var header, content, content_clone, uriContent, viewBox, svg;
        header = "<?xml version=\'1.0\' standalone=\'no\'?><!DOCTYPE svg PUBLIC \'-//W3C//DTD SVG 1.1//EN\'"+" "+"\'http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd\'>";
        //var xmlns_xlink = "http://www.w3.org/1999/xlink";

        content = this.environment.bgplayDom.find(".bgplayNodeContainer");

        content_clone = content.clone();

        svg = content_clone.find("svg");

        svg.removeAttr("height").removeAttr("width");
        var x = this.environment.GraphView.graph.getMinX() - this.environment.config.graph.nodeWidth;
        var y = this.environment.GraphView.graph.getMinY() - this.environment.config.graph.nodeHeight;
        var width=this.environment.GraphView.graph.getMaxX()-x + this.environment.config.graph.nodeWidth;
        var height=this.environment.GraphView.graph.getMaxY()-y + this.environment.config.graph.nodeHeight;

        svg.attr("viewBox", x+" "+y+" "+width+" "+height);

        uriContent = 'data:text/html,' + encodeURIComponent(header+content_clone.html());
        window.open(uriContent, 'BGPlay');
    }
});