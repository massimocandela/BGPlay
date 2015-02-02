/*
 * BGPlay.js
 * Copyright (c) 2013 Massimo Candela, Giuseppe Di Battista, Claudio Squarcella, Roma Tre University and RIPE NCC
 * http://www.bgplayjs.com
 *
 * See the file LICENSE.txt for copying permission.
 */

/**
 * An instance of Instant is an abstraction of a point in time.
 * It is composed of an ID and a unix timestamp.
 * The timestamp is the first parameter considered during a sort of a set of instants.
 * In case of equal timestamps, the ID order is decisive.
 * @class Instant
 * @module model
 */
var Instant = Backbone.Model.extend({
    getId:function(){
        return this.get("id");
    },

    /**
     * Returns the timestamp of this instant.
     * @method getTimestamp
     * @return {Integer} The timestamp of this instant
     */
    getTimestamp:function(){
        return this.get("timestamp");
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
            err.push("Id cannot be null");
        if(attrs.timestamp==null)
            err.push("Timestamp cannot be null");

        if (err.length>0)
            return err;
    },

    /**
     * Returns a human-readable string representing the timestamp of this instant.
     * @method getDate
     * @return {String} A human-readable string representing the timestamp of this instant
     */
    getDate:function(){
        return dateToString(new Date(this.get("timestamp")));
    },

    /**
     * Returns a string representing this object.
     * @method toString
     * @return {String} A string representing this object
     */
    toString:function(){
     return this.get("id")+","+this.get("timestamp");
    }
});