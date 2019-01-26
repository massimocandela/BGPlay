/*
 * BGPlay.js
 * Copyright (c) 2013 Massimo Candela, Giuseppe Di Battista, Claudio Squarcella, Roma Tre University and RIPE NCC
 * http://bgplayjs.com
 *
 * See the file LICENSE.txt for copying permission.
 */

BplayTest = TestCase("BgplayTest");
var bgplay;

//initialization, this function will be invoked before each test.
BplayTest.prototype.setUp = function () {
    JsonWrap(prefixhistory);
};

//Test UC1
BplayTest.prototype.testInitialState = function () {
    assertEquals(bgplay.get("cur_instant").get("timestamp"), 1333756800);
    assertEquals(bgplay.get("sources").get("rrc0-212.25.27.44").get("cur_events").get("1.23.97.0/24").get("shortdescription"), "8758 15576 6772 6730 6730 3320 3561 9498 45528");
};

//Test UC2
BplayTest.prototype.testSetCurInstant = function () {
    bgplay.setCurInstant(new Instant({id:1, timestamp:1333776311}));
    assertEquals(bgplay.get("cur_instant").get("timestamp"), 1333776311);
};


