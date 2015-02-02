/*
 * BGPlay.js
 * Copyright (c) 2013 Massimo Candela, Giuseppe Di Battista, Claudio Squarcella, Roma Tre University and RIPE NCC
 * http://www.bgplayjs.com
 *
 * See the file LICENSE.txt for copying permission.
 */

/**
 * @class Node
 * @module model
 */
var Node = Backbone.Model.extend({
    defaults:{
        type:"node"
    },
    urlRoot : '/nodes',

    /**
     * The initialization method of this object.
     * @method initialize
     * @param {Map} A map of parameters
     */
    initialize:function(){
        this.attributes.sources = new Array();
        this.attributes.targets=new Array();
    },

    /**
     * Adds a source to this node.
     * @method addSource
     * @param {Object} An instance of Source
     */
    addSource:function(source){
        for (var n=0;n<this.get("sources").length;n++)
            if (this.get("sources")[n]==source)
                return;
        this.get("sources").push(source);
    },

    /**
     * Adds a target to this node.
     * @method addTarget
     * @param {Object} An instance of Source
     */
    addTarget:function(target){
        for (var n=0;n<this.get("targets").length;n++)
            if (this.get("targets")[n]==target)
                return;
        this.get("targets").push(target);
    },

    /**
     * The validation method of this object.
     * This method is used to check the initialization parameters.
     * @method validate
     * @param {Map} A map of parameters
     * @return {Array} An array of {String} errors
     */
    validate:function(attrs){
        var err=new Array();
        if(attrs.id==null)
            err.push("An id is required!");

        if (err.length>0)
            return err;
    },

    /**
     * Returns a string representing this object.
     * @method toString
     * @return {String} A string representing this object
     */
    toString:function(){
        return this.id;
    }
});

var Nodes = Backbone.Collection.extend({
    model:Node
});
