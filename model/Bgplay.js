/*
 * BGPlay.js
 * Copyright (c) 2013 Massimo Candela, Giuseppe Di Battista, Claudio Squarcella, Roma Tre University and RIPE NCC
 * http://bgplayjs.com
 *
 * See the file LICENSE.txt for copying permission.
 */

/**
 * This is the Facade of the model layer.
 * It manages all the collections of objects of the model layer and all the parameters needed to describe the domain.
 * @class Bgplay
 * @module model
 *
 */
var Bgplay = Backbone.Model.extend({
    defaults:function(){
        return {
            "sources": new Sources(),
            "targets": new Targets(),
            "clusters": new net.webrobotics.TreeMap(comparator,{allowDuplicateKeys:false,suppressDuplicateKeyAlerts:true}),
            "realPrefixes": [],
            "type":"bgp",//this is a default value, it must be set with an appropriate value
            "cur_instant":null,//This var is extremely important
            "nodes":new net.webrobotics.TreeMap(
                function(id1,id2){
                    if (id1<id2)
                        return -1;
                    else if (id1>id2)
                        return 1;
                    else
                        return 0;
                },{allowDuplicateKeys:false,suppressDuplicateKeyAlerts:true}),
            "allEvents":new net.webrobotics.TreeMap(
                function(obj1,obj2){
                    if (obj1.getTimestamp()<obj2.getTimestamp() || (obj1.getTimestamp()==obj2.getTimestamp() && obj1.getId()<obj2.getId()))
                        return -1;
                    if (obj1.getTimestamp()>obj2.getTimestamp() || (obj1.getTimestamp()==obj2.getTimestamp() && obj1.getId()>obj2.getId()))
                        return 1;
                    if (obj1.getTimestamp()==obj2.getTimestamp() && obj1.getId()==obj2.getId())
                        return 0;
                }
                ,{allowDuplicateKeys:false,suppressDuplicateKeyAlerts:true})
        }
    },

    /**
     * Set a new current instant.
     * It is an additional level of indirection compared to the native Backbone's set method.
     * @method setCurInstant
     * @param {Object} An instance of Instant
     * @param {Boolean} If true a "change" event will be triggered
     *
     */
    setCurInstant: function(instant, silent){
        if (silent){
            this.attributes.cur_instant = instant;
        }else{
            this.set({cur_instant: instant});
        }
    },

    /**
     * Forces the update of the model.
     * @method updateState
     */
    updateState:function(){
        this.get("sources").forEach(function(element){
            element.updateState();
        });
    },

    /**
     * Adds a node to the model.
     * @method addNode
     * @param {Object} An instance of Node
     */
    addNode:function(node){
        this.get("nodes").put(node.get("id"),node);
    },

    /**
     * Adds a cluster to the model.
     * @method addCluster
     * @param {Object} An instance of Cluster
     */
    addCluster:function(cluster){
        this.get("clusters").put(cluster.id, cluster);
    },
    /**
     * Adds a source to the model.
     * @method addSource
     * @param {Object} An instance of Source
     */
    addSource:function(source){
        this.attributes.sources.add(source);
    },

    /**
     * Adds a target to the model.
     * @method addTarget
     * @param {Object} An instance of Target
     */
    addTarget:function(target){
        this.attributes.targets.add(target);
    },

    /**
     * Returns a node given an ID
     * @method getNode
     * @param {String} An ID of a node
     * @return {Object} The node with that ID
     */
    getNode:function(id){
        return this.get("nodes").get(id);
    },

    /**
     * Returns a cluster given an ID
     * @method getCluster
     * @param {String} An ID of a cluster
     * @return {Object} The cluster with that ID
     */
    getCluster: function(id){
        return this.get("clusters").get(id);
    },

    /**
     * Returns a source given an ID
     * @method getSource
     * @param {String} An ID for a source
     * @return {Object} The source with that ID
     */
    getSource:function(id){
        return this.get("sources").get(id);
    },

    /**
     * Returns a target given an ID
     * @method getTarget
     * @param {String} An ID for a target
     * @return {Object} The target with that ID
     */
    getTarget: function(id){
        return this.get("targets").get(id);
    },

    getPrefixes: function(){
        var realPrefixes = this.get("realPrefixes");
        if (realPrefixes.length == 0){
            this.get("targets").forEach(function(target){
                realPrefixes.push(target);
            });
        }

        return realPrefixes;
    },

    /**
     * The validation method of Bgplay.
     * This method is used to check the initialization parameters.
     * @method validate
     * @param {Map} A map of parameters
     * @return {Array} An array of {String} errors
     */
    validate:function(attrs){
        var err = [];
        if(!attrs.starttimestamp)
            err.push("starttimestamp cannot be null!");
        if(!attrs.endtimestamp)
            err.push("endtimestamp cannot be null!");
        if(attrs.endtimestamp<attrs.starttimestamp)
            err.push("Wait a minute, Doc. Ah... Are you telling me that you built a time machine... out of a DeLorean?");
        if(!attrs.type)
            err.push("A type is required!");

        if (err.length>0)
            return err;
    }
});
