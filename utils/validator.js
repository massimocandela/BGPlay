/*
 * BGPlay.js
 * Copyright (c) 2013 Massimo Candela, Giuseppe Di Battista, Claudio Squarcella, Roma Tre University and RIPE NCC
 * http://www.bgplayjs.com
 *
 * See the file LICENSE.txt for copying permission.
 */

function validateIpv4and6Prefix(str){
    return validateIpv6Prefix(str) || validateIpv4Prefix(str);
}

function validateIpv4and6Address(str){
    return validateIpv6Address(str) || validateIpv4Address(str);
}

function validateIpv6Prefix(str){
    if (str.indexOf(":") == -1)
        return false;
    return /^:?([a-fA-F0-9]{1,4}(:|.)?){0,8}(:|::)?([a-fA-F0-9]{1,4}(:|.)?){0,8}\/([0-9]|[1-9][1-9]|1[0-1][0-9]|12[0-8])$/.test(str);

}
function validateIpv4Prefix(str){
    return /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|2[0-5][0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|2[0-5][0-5])\/([0-9]|[1-2][0-9]|3[0-2])$/.test(str);
}


function validateIpv6Address(str){
    if (str.indexOf(":") == -1)
        return false;
    return /^:?([a-fA-F0-9]{1,4}(:|.)?){0,8}(:|::)?([a-fA-F0-9]{1,4}(:|.)?){0,8}$/.test(str);

}
function validateIpv4Address(str){
    return /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|2[0-5][0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|2[0-5][0-5])$/.test(str);
}

function validateAS(str){
    return /^((AS|as|As|aS)?[0-9]{1,10})$/.test(str);
}


function validateProbe(str){
    return /^([0-9]{1,6})$/.test(str);
}
