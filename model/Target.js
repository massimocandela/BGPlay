/*
 * BGPlay.js
 * Copyright (c) 2013 Massimo Candela, Giuseppe Di Battista, Claudio Squarcella, Roma Tre University and RIPE NCC
 * http://www.bgplayjs.com
 *
 * See the file LICENSE.txt for copying permission.
 */

/**
 * @class Target
 * @module model
 */
var Target = Backbone.Model.extend({
    defaults: function(){
        return{
            type:"target",
            nodes:[]
        }

    },
    addNode:function(element){
        if (!arrayContains(this.attributes.nodes, element)){
            this.attributes.nodes.push(element);
        }
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
        var out="";
        switch (this.attributes.environment.bgplay.get("type")){
            default:
                out=this.get("id")||"";
                break;
        }
        return out;
    }
});

var Targets=Backbone.Collection.extend({
    model:Target
});
