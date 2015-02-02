/*
 * BGPlay.js
 * Copyright (c) 2013 Massimo Candela, Giuseppe Di Battista, Claudio Squarcella, Roma Tre University and RIPE NCC
 * http://www.bgplayjs.com
 *
 * See the file LICENSE.txt for copying permission.
 */

var net = net || {};
net.webrobotics = net.webrobotics || {};

net.webrobotics.GraphUtils = function () {
    /**
     * Returns the distance between two points.
     *
     * @method pointDistance
     * @param {Number,Number} x and y of the first point
     * @param {Number,Number} x and y of the second point
     * @return {Number} the distance between the two points
     */
    this.pointDistance = function (p1, p2) {
        var diffX, diffY;
        diffX = p2.x - p1.x;
        diffY = p2.y - p1.y;
        return Math.sqrt((diffX*diffX)+(diffY*diffY));
    };

    this.vectorModule = function (vector) {
        return Math.abs(this.pointDistance({x:0, y:0}, vector));
    };

    this.isNumeric = function (n) {
        return !isNaN(parseFloat(n)) && isFinite(n)
    };

    this.unitVector = function (p1, p2) {
        var distance = this.pointDistance(p1, p2);
        return (distance == 0) ? {x:(p2.x - p1.x), y:(p2.y - p1.y)} : {x:(p2.x - p1.x) / distance, y:(p2.y - p1.y) / distance};
    };

    this.cathetus = function (hypotenuse, otherLeg) {
        return Math.sqrt((hypotenuse*hypotenuse) - (otherLeg*otherLeg));
    };

    this.inverseVector = function (vector) {
        return {x:-vector.x, y:-vector.y};
    };

    this.leftUnitVector = function (unitVector) {
        return {x:-unitVector.y, y:unitVector.x};
    };

    this.radiusOfTheInscribedCircle = function (width, height) {
        return Math.min(width, height) / 2;
    };

    this.angle = function (vector) {
        var module = this.vectorModule(vector);
        var x = Math.abs(vector.x);
        var y = Math.abs(vector.y);
    };

    this.vectorProjection = function (vector, axis) {
        return (axis == "x") ? {x:vector.x, y:0} : {x:0, y:vector.y};
    };

    this.sumBetweenVectors = function (v1, v2) {
        return {x:v1.x + v2.x, y:v1.y + v2.y};
    };

    this.mulVectorForValue = function (vector, value) {
        return {x:vector.x * value, y:vector.y * value};
    };

    this.pointAtDistance = function (distance, unitVector, point) {
        return this.sumBetweenVectors(this.mulVectorForValue(unitVector, distance), point);
    };

    this.translatePoint = function (point, vector) {
        var newPoint = this.sumBetweenVectors(vector, point);
        point.x = newPoint.x;
        point.y = newPoint.y;
        return point;
    };

    this.transformPointToPoint = function (from, to) {
        from.x = to.x;
        from.y = to.y;
    };

    this.hook = function (node1, node2, optimalDistance, limit) {
        var newPoint1, newPoint2, difference, unitVector, distance,force, kSpringFactor;

        kSpringFactor=0.2; //0.3
        distance = this.pointDistance(node1, node2);
        difference = distance - (optimalDistance * Math.abs(node1.orbit - node2.orbit));
        if (difference != 0) {
            unitVector = this.unitVector(node1, node2);
            difference = (limit != null && difference > limit) ? limit : difference;
            force=kSpringFactor*difference;
            newPoint1 = this.mulVectorForValue(unitVector, force);
            newPoint2 = this.mulVectorForValue(this.inverseVector(unitVector), force);

            node1.vectors.push(newPoint1);
            node2.vectors.push(newPoint2);
        }


    };

    this.coulomb = function (node1, node2, factor1, factor2, limit, maxDistance) {
        var newPoint1, newPoint2, unitVector, distance, repulsionFactor, force1, force2, factorSum, factorPercentage;
        repulsionFactor = 80;//350
        distance = this.pointDistance(node1, node2);
        if (distance > maxDistance) return;

        factorSum = factor1 + factor2 + 0.00000001;//in order to avoid the Infinity error

        factorPercentage = (100/factorSum);
        factor1 = factorPercentage*factor1;
        factor2 = factorPercentage*factor2;

        distance = distance + 0.000001; //in order to avoid the Infinity error

        force1 = (repulsionFactor * (1/distance))/100 * factor2;
        force2 = (repulsionFactor * (1/distance))/100 * factor1;

        force1 = (force1 > limit) ? limit : force1;
        force2 = (force2 > limit) ? limit : force2;

        unitVector = this.unitVector(node1, node2);
        newPoint1 = this.mulVectorForValue(this.inverseVector(unitVector), force1);
        newPoint2 = this.mulVectorForValue(unitVector, force2);

        node1.vectors.push(newPoint1);
        node2.vectors.push(newPoint2);
    };

    this.straighten = function (node1, node2, node3) {
        var unitVector1 = this.unitVector(node1, node2);
        var unitVector2 = this.unitVector(node2, node3);
        var distance = this.pointDistance(node2, node3);
        var resultVector1 = this.unitVector(unitVector2, unitVector1);
        var resultVector2 = this.unitVector(unitVector1, unitVector2);
        node2.vectors.push(this.mulVectorForValue(resultVector1, 2));
        node3.vectors.push(this.mulVectorForValue(resultVector2, 2));
    };


    this.computeFinalPosition = function (node) {
        var element;
        for (var n = 0; n < node.vectors.length; n++) {
            element = node.vectors[n];
            node.x += element.x;
            node.y += element.y;
        }

        node.vectors = new Array();
    };

    this.absOrientation = function (node1, node2) {
        return (parseInt(node1.view.graphId) <= parseInt(node2.view.graphId)) ? [node1, node2] : [node2, node1];
    };

    this.edgeNodeRepulsion = function(edge, node, limit, maxDistance, n){
        var angolarCoefficient, perpendicolarCoefficient, q1, q2, px, py, tmpPoint, newPoint1, unitVector, distance, repulsionFactor, force;
        if (edge[1].id != node.id && edge[0].id != node.id){

            angolarCoefficient =  (edge[1].y - edge[0].y)/(edge[1].x - edge[0].x);

            q1 = edge[1].y - (angolarCoefficient * edge[1].x);
            perpendicolarCoefficient = -1/angolarCoefficient;

            q2 = node.y - (perpendicolarCoefficient * node.x);
            px = (q2-q1)/(angolarCoefficient - perpendicolarCoefficient);
            py = (perpendicolarCoefficient * px) + q2;
            tmpPoint = {x:px, y:py, vectors:[]};

            distance = this.pointDistance(tmpPoint, node);
            if (Math.max(edge[0].x, edge[1].x)>= px && Math.min(edge[0].x, edge[1].x)<= px  &&
                Math.max(edge[0].y, edge[1].y)>= py && Math.min(edge[0].y, edge[1].y)<= py &&
                distance < maxDistance){

                repulsionFactor = 80;//350

                force = repulsionFactor*Math.sqrt(n);
                force = (force > limit) ? limit : force;

                unitVector = this.unitVector(tmpPoint, node);
                newPoint1 = this.mulVectorForValue(unitVector, force);
                node.vectors.push(newPoint1);

            }
        }
    }

    this.roundedPath = function (curveCoefficient, p1, p2, p3) {
        var points = [];
        var vector1 = this.unitVector(p2, p1);
        var vector2 = this.unitVector(p2, p3);

        var borderPoint1 = this.pointAtDistance(curveCoefficient, vector1, p2);
        var borderPoint2 = this.pointAtDistance(curveCoefficient, vector2, p2);

        var middlePoint1 = this.pointAtDistance(curveCoefficient / 2, vector1, p2);
        var middlePoint2 = this.pointAtDistance(curveCoefficient / 2, vector2, p2);

        var centralPoint = this.pointAtDistance(this.pointDistance(middlePoint2, middlePoint1) / 2, vector2, middlePoint2);

        points.push(borderPoint1);
        points.push(middlePoint1);
        points.push(centralPoint);
        points.push(middlePoint2);
        points.push(borderPoint2);
        return points;
    }
};



