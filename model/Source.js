/*
 * BGPlay.js
 * Copyright (c) 2013 Massimo Candela, Giuseppe Di Battista, Claudio Squarcella, Roma Tre University and RIPE NCC
 * http://bgplayjs.com
 *
 * See the file LICENSE.txt for copying permission.
 */

/**
 * @class Source
 * @module model
 */
var Source = Backbone.Model.extend({
    defaults:{
        type:"source"
    },

    /**
     * The initialization method of this object.
     * @method initialize
     * @param {Map} A map of parameters
     */
    initialize:function(){
        this.attributes.events={};
        this.attributes.cur_events={};
        this.environment=this.attributes.environment;
        this.bgplay=this.environment.bgplay;
        this.bgplay.on("change:cur_instant", function(){
            this.updateState();
        },this);
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
     * This method updates the state of this source, it is triggered at each change of the current instant defined by Bgplay.
     * The objective of this method is to find the current event in which the source is involved.
     * If the current event changes then this method triggers a "curEventChange" event (pub/sub) containing the current event.
     * If the current event is null then this method triggers a "curEventNull" event (pub/sub) containing the previous event.
     * @method updateState
     */
    updateState: function(){
        var oldEvent;
        var instant = this.bgplay.get("cur_instant");

        for (var cur_target in this.get("events")){

            var tree = this.get("events")[cur_target]; //TreeMap for the current target
            var curEventForThisTarget = tree.nearest(instant, false, true);

            oldEvent = this.get("cur_events")[cur_target];
            if (curEventForThisTarget != null){
                if (oldEvent != curEventForThisTarget || tree.compare(curEventForThisTarget.get("instant"), instant) == 0){
                    this.trigger('curEventChange', curEventForThisTarget);
                }
            }else{
                this.trigger('curEventNull', oldEvent);
            }
            this.get("cur_events")[cur_target] = curEventForThisTarget;
        }

    },

    /**
     * Returns a string representing this object.
     * @method toString
     * @return {String} A string representing this object
     */
    toString:function(){
        var out = "";
        switch (this.bgplay.get("type")){
            default:
                out = this.get("id")||"";
                break;
        }
        return out;
    },

    /**
     * Adds an event involving this source.
     * @method addEvent
     * @param {Object} An instance of Event
     */
    addEvent: function(event){
        var target=event.get("target");
        if (!this.get("events")[target.get("id")]){
            this.get("events")[target.get("id")]= new net.webrobotics.TreeMap(
                function(obj1,obj2){
                    if (obj1.getTimestamp()<obj2.getTimestamp() || (obj1.getTimestamp()==obj2.getTimestamp() && obj1.getId()<obj2.getId()))
                        return -1;
                    if (obj1.getTimestamp()>obj2.getTimestamp() || (obj1.getTimestamp()==obj2.getTimestamp() && obj1.getId()>obj2.getId()))
                        return 1;
                    if (obj1.getTimestamp()==obj2.getTimestamp() && obj1.getId()==obj2.getId())
                        return 0;
                },
                {allowDuplicateKeys:false,suppressDuplicateKeyAlerts:true}
            );
        }
        this.get("events")[target.get("id")].put(event.get("instant"),event);
    }
});

var Sources=Backbone.Collection.extend({
    model:Source
});
