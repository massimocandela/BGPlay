/*
 * BGPlay.js
 * Copyright (c) 2013 Massimo Candela, Giuseppe Di Battista, Claudio Squarcella, Roma Tre University and RIPE NCC
 * http://www.bgplayjs.com
 *
 * See the file LICENSE.txt for copying permission.
 */

/**
 * @class Event
 * @module model
 */
var Event = Backbone.Model.extend({
    /**
     * The validation method of this object.
     * This method is used to check the initialization parameters.
     * @method validate
     * @param {Map} A map of parameters
     * @return {Array} An array of {String} errors
     */
    validate:function(attrs){
        var err=new Array();

        if(attrs.instant==null)
            err.push("Instant cannot be null!");
        if(attrs.target==null)
            err.push("Target cannot be null!");
        if(attrs.source==null)
            err.push("Source cannot be null!");

        if (err.length>0)
            return err;
    }
});

var Events=Backbone.Collection.extend({
    model:Event
});





