// secrets.js - by Alexander Stetsyuk - released under MIT License
(function(m,k){function t(b){if(b&&("number"!==typeof b||0!==b%1||b<g.h||b>g.f))throw Error("Number of bits must be an integer between "+g.h+" and "+g.f+", inclusive.");a.b=g.b;a.a=b||g.a;a.size=Math.pow(2,a.a);a.max=a.size-1;b=[];for(var e=[],d=1,c=g.l[a.a],f=0;f<a.size;f++)e[f]=d,b[d]=f,d<<=1,d>=a.size&&(d^=c,d&=a.max);a.c=b;a.e=e}function u(){return a.a&&a.size&&a.max&&a.c&&a.e&&a.c.length===a.size&&a.e.length===a.size?!0:!1}function z(){function b(b,e,a,d){for(var c="",g=0,m=e.length-1;g<m||c.length<
b;)c+=p(parseInt(e[g],a).toString(2),d),g++;c=c.substr(-b);return(c.match(/0/g)||[]).length===c.length?null:c}var e,d;if("function"===typeof require&&(d=require("crypto"))&&(e=d.randomBytes))return function(a){for(var d=Math.ceil(a/8),c=null;null===c;)c=b(a,e(d).toString("hex"),16,4);return c};if(k.crypto&&"function"===typeof k.crypto.getRandomValues&&"function"===typeof k.Uint32Array)return d=k.crypto,function(a){for(var e=null,c=new k.Uint32Array(Math.ceil(a/32));null===e;)d.getRandomValues(c),
e=b(a,c,10,32);return e};a.d=!0;q();var c=Math.pow(2,32)-1;return function(a){for(var e=Math.ceil(a/32),d=[],l=null;null===l;){for(l=0;l<e;l++)d[l]=Math.floor(Math.random()*c+1);l=b(a,d,10,32)}return l}}function q(){k.console.warn(g.k);"function"===typeof k.alert&&a.alert&&k.alert(g.k)}function s(b){var e=parseInt(b[0],36);if(e&&("number"!==typeof e||0!==e%1||e<g.h||e>g.f))throw Error("Number of bits must be an integer between "+g.h+" and "+g.f+", inclusive.");var d=Math.pow(2,e)-1,c=d.toString(a.b).length,
f=parseInt(b.substr(1,c),a.b);if("number"!==typeof f||0!==f%1||1>f||f>d)throw Error("Share id must be an integer between 1 and "+a.max+", inclusive.");b=b.substr(c+1);if(!b.length)throw Error("Invalid share: zero-length share.");return{bits:e,id:f,value:b}}function v(b,e){for(var d,c,f=[],n=[],h="",l,g=0,m=e.length;g<m;g++){c=s(e[g]);if("undefined"===typeof d)d=c.bits;else if(c.bits!==d)throw Error("Mismatched shares: Different bit settings.");a.a!==d&&t(d);a:{l=0;for(var k=f.length;l<k;l++)if(f[l]===
c.id){l=!0;break a}l=!1}if(!l){l=f.push(c.id)-1;c=w(x(c.value));for(var k=0,q=c.length;k<q;k++)n[k]=n[k]||[],n[k][l]=c[k]}}g=0;for(m=n.length;g<m;g++)h=p(y(b,f,n[g]).toString(2))+h;return 0===b?(l=h.indexOf("1"),r(h.slice(l+1))):r(h)}function y(b,e,d){var c=0,f,n,h;n=0;for(var g=e.length;n<g;n++)if(d[n]){f=a.c[d[n]];for(h=0;h<g;h++)if(n!==h){if(b===e[h]){f=-1;break}f=(f+a.c[b^e[h]]-a.c[e[n]^e[h]]+a.max)%a.max}c=-1===f?c:c^a.e[f]}return c}function w(b,e){e&&(b=p(b,e));for(var d=[],c=b.length;c>a.a;c-=
a.a)d.push(parseInt(b.slice(c-a.a,c),2));d.push(parseInt(b.slice(0,c),2));return d}function p(b,e){e=e||a.a;var d=b.length%e;return(d?Array(e-d+1).join("0"):"")+b}function x(b){for(var a="",d,c=b.length-1;0<=c;c--){d=parseInt(b[c],16);if(isNaN(d))throw Error("Invalid hex character.");a=p(d.toString(2),4)+a}return a}function r(b){var a="",d;b=p(b,4);for(var c=b.length;4<=c;c-=4){d=parseInt(b.slice(c-4,c),2);if(isNaN(d))throw Error("Invalid binary character.");a=d.toString(16)+a}return a}var g={a:8,
b:16,h:3,f:20,j:2,g:6,l:[null,null,1,3,3,5,3,3,29,17,9,5,83,27,43,3,45,9,39,39,9,5,3,33,27,9,71,39,9,5,83],k:"WARNING:\nA secure random number generator was not found.\nUsing Math.random(), which is NOT cryptographically strong!"},a={};m.getConfig=function(){return{bits:a.a,unsafePRNG:a.d}};m.init=t;m.setRNG=function(b,e){u()||this.init();a.d=!1;b=b||z();if("function"!==typeof b||"string"!==typeof b(a.a)||!parseInt(b(a.a),2)||b(a.a).length>a.a||b(a.a).length<a.a)throw Error("Random number generator is invalid. Supply an RNG of the form function(bits){} that returns a string containing 'bits' number of random 1's and 0's.");
a.i=b;a.alert=!!e;return!!a.d};m.random=function(b){"function"!==typeof a.i&&this.setRNG();if("number"!==typeof b||0!==b%1||2>b)throw Error("Number of bits must be an integer greater than 1.");a.d&&q();return r(a.i(b))};m.share=function(b,e,d,c,f){u()||this.init();"function"!==typeof a.i&&this.setRNG();c=c||0;if("string"!==typeof b)throw Error("Secret must be a string.");if("number"!==typeof e||0!==e%1||2>e)throw Error("Number of shares must be an integer between 2 and 2^bits-1 ("+a.max+"), inclusive.");
if(e>a.max)throw f=Math.ceil(Math.log(e+1)/Math.LN2),Error("Number of shares must be an integer between 2 and 2^bits-1 ("+a.max+"), inclusive. To create "+e+" shares, use at least "+f+" bits.");if("number"!==typeof d||0!==d%1||2>d)throw Error("Threshold number of shares must be an integer between 2 and 2^bits-1 ("+a.max+"), inclusive.");if(d>a.max)throw f=Math.ceil(Math.log(d+1)/Math.LN2),Error("Threshold number of shares must be an integer between 2 and 2^bits-1 ("+a.max+"), inclusive.  To use a threshold of "+
d+", use at least "+f+" bits.");if("number"!==typeof c||0!==c%1)throw Error("Zero-pad length must be an integer greater than 1.");a.d&&q();b="1"+x(b);b=w(b,c);c=Array(e);for(var g=Array(e),h=0,l=b.length;h<l;h++)for(var m=this._getShares(b[h],e,d),k=0;k<e;k++)c[k]=c[k]||m[k].x.toString(a.b),g[k]=p(m[k].y.toString(2))+(g[k]?g[k]:"");d=a.max.toString(a.b).length;if(f)for(h=0;h<e;h++)c[h]=r(g[h]);else for(h=0;h<e;h++)c[h]=a.a.toString(36).toUpperCase()+p(c[h],d)+r(g[h]);return c};m._getShares=function(b,
e,d){var c=[];b=[b];for(var f=1;f<d;f++)b[f]=parseInt(a.i(a.a),2);f=1;for(e+=1;f<e;f++){d=a.c[f];for(var g=0,h=b.length-1;0<=h;h--)g=0===g?b[h]:a.e[(d+a.c[g])%a.max]^b[h];c[f-1]={x:f,y:g}}return c};m._processShare=s;m.combine=function(b){return v(0,b)};m.newShare=function(b,e){"string"===typeof b&&(b=parseInt(b,a.b));var d=s(e[0]),d=Math.pow(2,d.bits)-1;if("number"!==typeof b||0!==b%1||1>b||b>d)throw Error("Share id must be an integer between 1 and "+a.max+", inclusive.");return a.a.toString(36).toUpperCase()+
p(b.toString(a.b),d.toString(a.b).length)+v(b,e)};m._lagrange=y;m.str2hex=function(b,a){if("string"!==typeof b)throw Error("Input must be a character string.");a=a||g.j;if("number"!==typeof a||0!==a%1||1>a||a>g.g)throw Error("Bytes per character must be an integer between 1 and "+g.g+", inclusive.");for(var d=2*a,c=Math.pow(16,d)-1,f="",k,h=0,l=b.length;h<l;h++){k=b[h].charCodeAt();if(isNaN(k))throw Error("Invalid character: "+b[h]);if(k>c)throw d=Math.ceil(Math.log(k+1)/Math.log(256)),Error("Invalid character code ("+
k+"). Maximum allowable is 256^bytes-1 ("+c+"). To convert this character, use at least "+d+" bytes.");f=p(k.toString(16),d)+f}return f};m.hex2str=function(a,e){if("string"!==typeof a)throw Error("Input must be a hexadecimal string.");e=e||g.j;if("number"!==typeof e||0!==e%1||1>e||e>g.g)throw Error("Bytes per character must be an integer between 1 and "+g.g+", inclusive.");var d=2*e,c="";a=p(a,d);for(var f=0,k=a.length;f<k;f+=d)c=String.fromCharCode(parseInt(a.slice(f,f+d),16))+c;return c};m.init()})("undefined"!==
typeof module&&module.exports?module.exports:window.secrets={},"undefined"!==typeof GLOBAL?GLOBAL:window);
