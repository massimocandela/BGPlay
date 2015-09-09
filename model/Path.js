/*
 * BGPlay.js
 * Copyright (c) 2013 Massimo Candela, Giuseppe Di Battista, Claudio Squarcella, Roma Tre University and RIPE NCC
 * http://www.bgplayjs.com
 *
 * See the file LICENSE.txt for copying permission.
 */

/**
 * A path is an ordered set of nodes.
 * @class Path
 * @module model
 */
var Path = Backbone.Model.extend({

    /**
     * The initialization method of this object.
     * @method initialize
     * @param {Map} A map of parameters
     */
    initialize:function(){
        this.fastSearchNodes = {};
        this.attributes.nodes = [];
    },

    /**
     * Adds a node to this path.
     * @method addNode
     * @param {Object} An instance of Node
     */
    addNode:function(node){
        this.get("nodes").push(node);
    },

    /**
     * Checks if this path contains a given node.
     * @method contains
     * @param {Object} An instance of Node
     * @return {Boolean} True if the path contains the given node.
     */
    contains:function(element){
        //check execution time here:
        // http://jsperf.com/indexof-vs-loop/2
        // http://jsperf.com/various-loop

        var nodes=this.attributes.nodes;
        var length=nodes.length;
        for (var i=length;i--;){
            if (nodes[i].id==element.id)
                return true;
        }
        return false;
    },

    /**
     * The validation method of this object.
     * This method is used to check the initialization parameters.
     * @method validate
     * @param {Map} A map of parameters
     * @return {Array} An array of {String} errors
     */
    validate:function(attrs){
        var err=[];

        if (err.length>0)
            return err;
    },

    /**
     * Returns a string representing this object.
     * @method toString
     * @return {String} A string representing this object
     */
    toString:function(){
        var out = "";
        var nodes = this.attributes.nodes;
        if (nodes.length > 0){
            for (var n=0; n<nodes.length-1; n++){
                out += nodes[n].get("id") + ", ";
            }
            out += nodes[nodes.length-1].get("id");
        }

        return out;
    }
});

