/** @license
 * Copyright (c) 2013 NightDev
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice, any copyright notices herein, and this permission
 * notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
/** @license
 * Gritter for jQuery
 * http://www.boedesign.com/
 *
 * Copyright (c) 2012 Jordan Boesch
 * Dual licensed under the MIT and GPL licenses.
 */
BetterTTVEngine = function () {

    var bttvVersion = "6.5.1",
        bttvRelease = 1,
        bttvDebug = {
            log: function (string) {
                if (window.console && console.log) console.log("BTTV: " + string);
            },
            warn: function (string) {
                if (window.console && console.warn) console.warn("BTTV: " + string);
            },
            error: function (string) {
                if (window.console && console.error) console.error("BTTV: " + string);
            },
            info: function (string) {
                if (window.console && console.info) console.info("BTTV: " + string);
            }
        },
        bttvSettings = {},
        currentViewers = [],
        liveChannels = [],
        blackChat = false;

    /**
     * Helper Functions
     */
    String.prototype.capitalize = function () {
        return this.charAt(0).toUpperCase() + this.slice(1);
    }

    removeElement = function (e) {
        // Removes all of an element
        bttvJquery(e).each(function () {
            bttvJquery(this).hide();
        });
    }

    displayElement = function (e) {
        // Displays all of an element
        bttvJquery(e).each(function () {
            bttvJquery(this).show();
        });
    }

    escapeRegExp = function (text) {
        // Escapes an input to make it usable for regexes
        return text.replace(/[-[\]{}()+?.,\\^$|#\s]/g, "\\$&");
    }

    calculateColorBackground = function (color) {
        // Converts HEX to YIQ to judge what color background the color would look best on
        color = String(color).replace(/[^0-9a-f]/gi, '');
        if (color.length < 6) {
            color = color[0] + color[0] + color[1] + color[1] + color[2] + color[2];
        }

        var r = parseInt(color.substr(0, 2), 16);
        var g = parseInt(color.substr(2, 2), 16);
        var b = parseInt(color.substr(4, 2), 16);
        var yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
        return (yiq >= 128) ? "dark" : "light";
    }

    calculateColorReplacement = function (color, background) {
        // Modified from http://www.sitepoint.com/javascript-generate-lighter-darker-color/
        var inputColor = color,
            rgb = "#",
            brightness, c, i;

        color = String(color).replace(/[^0-9a-f]/gi, '');
        if (color.length < 6) {
            color = color[0] + color[0] + color[1] + color[1] + color[2] + color[2];
        }

        (background === "light") ? (brightness = "0.2") : (brightness = "-0.5");

        for (i = 0; i < 3; i++) {
            c = parseInt(color.substr(i * 2, 2), 16);
            if(c < 10) c = 10;
            c = Math.round(Math.min(Math.max(0, c + (c * brightness)), 255)).toString(16);
            rgb += ("00" + c).substr(c.length);
        }

        if(inputColor === rgb) {
            console.log("Color did not change: "+inputColor);
            if(background === "light") {
                return "#ffffff";
            } else {
                return "#000000";
            }
        } else {
            return rgb;
        }
    }

    getRgb = function(color) {
        // Convert HEX to RGB
        var regex = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
        return regex ? {
            r: parseInt(regex[1], 16),
            g: parseInt(regex[2], 16),
            b: parseInt(regex[3], 16)
        } : {
            r: 0,
            g: 0,
            b: 0
        };
    }

    getHex = function(color) {
        // Convert RGB object to HEX String
        var convert = function(c) {
            return ("0" + parseInt(c).toString(16)).slice(-2);
        }
        return '#'+convert(color['r'])+convert(color['g'])+convert(color['b']);
    }

    /**
     * Core Functions
     */
    clearClutter = function () {

        bttvDebug.log("Clearing Clutter");

        // Sidebar is so cluttered
        if (bttvSettings["showFeaturedChannels"] !== true) {
            removeElement('.sm_vids');
            removeElement('#nav_games');
            removeElement('#nav_streams');
            removeElement('.featured');
            removeElement('.related');
            removeElement('li[data-name="kabam"]');
        }

    }

    channelReformat = function () {

        if (bttvJquery("body[data-page=\"channel#channel\"]").length === 0) return;

        bttvDebug.log("Reformatting Channel Page");

        if (bttvSettings["chatWidth"]) {
            if (bttvSettings["chatWidth"] < 0) {
                bttvChangeSetting("chatWidth", 0);
            }
        }

        bttvJquery('#right_col').append("<div class='resizer' onselectstart='return false;' title='Drag to enlarge chat =D'></vid>");
        bttvJquery("#right_col:before").css("margin-left", "-1");

        bttvJquery(document).ready(function () {
            var resize = false;

            bttvJquery("#right_col .content .bottom #controls #control_buttons .primary_button").css("float", "right");
            bttvJquery("#right_nav").css({
                'margin-left': 'auto',
                'margin-right': 'auto',
                'width': '300px',
                'float': 'none',
                'border': 'none'
            });
            bttvJquery('#right_col .content .top').css('border-bottom', '1px solid rgba(0, 0, 0, 0.25)')

            bttvJquery("#right_close").unbind('click');

            bttvJquery("#left_close").click(function () {
                bttvJquery(window).trigger('resize');
            });

            bttvJquery(document).keydown(function (event) {
                if (event.keyCode === 82 && event.altKey) {
                    bttvJquery(window).trigger('resize');
                }
            });

            var handleResize = function () {
                bttvDebug.log("Page resized");

                var d = 0;
                if (bttvJquery("#large_nav").css("display") !== "none") {
                    d += bttvJquery("#large_nav").width();
                }
                if (bttvJquery("#small_nav").css("display") !== "none") {
                    d += bttvJquery("#small_nav").width();
                }
                if (chatWidth == 0) {
                    bttvJquery("#right_col").css({
                        display: "none"
                    });
                    bttvJquery("#right_close span").css({
                        "background-position": "0 0"
                    });
                }
                if (bttvJquery("#right_col").css("display") !== "none") {
                    if (bttvJquery("#right_col").width() < 340) {
                        chatWidth = 340;
                        bttvJquery("#right_col").width(chatWidth);
                        bttvJquery("#right_col .content #chat").width(chatWidth);
                        bttvJquery("#right_col .content .top").width(chatWidth);
                        bttvJquery("#chat_line_list").width(chatWidth);
                        bttvJquery("#chat_lines").width(chatWidth);
                        bttvJquery("#right_col").css("display", "inherit");
                        bttvJquery("#right_close span").css({
                            "background-position": "0 -18px"
                        });
                        handleResize();
                        return;
                    } else {
                        d += bttvJquery("#right_col").width();
                    }
                }

                bttvJquery("#main_col").css({
                    width: bttvJquery(window).width() - d + "px"
                });

                if (bttvJquery(".live_site_player_container").length) {
                    var h = 0.5625 * bttvJquery("#main_col").width() - 4;
                    videoMargin = 0;
                    var calcH = bttvJquery(window).height() - bttvJquery("#broadcast_meta").outerHeight(true) - bttvJquery("#stats_and_actions").outerHeight() + 45 - videoMargin - 10;
                    if (h > calcH) {
                        bttvJquery(".live_site_player_container").css({
                            height: bttvJquery(window).height() - bttvJquery("#stats_and_actions").outerHeight() + 45 - videoMargin - 10 + "px"
                        });
                        bttvJquery("#main_col .tse-scroll-content").animate({
                            scrollTop: bttvJquery('.live_site_player_container').position().top - 10
                        }, 150, "swing");
                    } else {
                        bttvJquery(".live_site_player_container").css({
                            height: h.toFixed(0) + "px"
                        });
                        bttvJquery("#main_col .tse-scroll-content").animate({
                            scrollTop: 0
                        }, 150, "swing");
                    }
                } else if (bttvJquery(".archive_site_player_container").length) {
                    var h = 0.5625 * bttvJquery("#main_col").width() - 4;
                    videoMargin = 0;
                    var calcH = bttvJquery(window).height() - bttvJquery("#broadcast_meta").outerHeight(true) - bttvJquery(".archive_info").outerHeight(true) - bttvJquery("#stats_and_actions").outerHeight() + 45 - videoMargin - 10;
                    if (h > calcH) {
                        bttvJquery(".archive_site_player_container").css({
                            height: bttvJquery(window).height() - bttvJquery(".archive_info").outerHeight(true) - bttvJquery("#stats_and_actions").outerHeight() + 45 - videoMargin - 10 + "px"
                        });
                        bttvJquery("#main_col .tse-scroll-content").animate({
                            scrollTop: bttvJquery('.archive_site_player_container').position().top - 10
                        }, 150, "swing");
                    } else {
                        bttvJquery(".archive_site_player_container").css({
                            height: h.toFixed(0) + "px"
                        });
                        bttvJquery("#main_col .tse-scroll-content").animate({
                            scrollTop: 0
                        }, 150, "swing");
                    }
                }

                var d = bttvJquery("#broadcast_meta .info .title").width();
                bttvJquery("#broadcast_meta .info .title .real_title").width() > d ? bttvJquery("#broadcast_meta .info").addClass("long_title") : bttvJquery("#broadcast_meta .info").removeClass("long_title");
                bttvJquery("#channel_panels_contain").masonry("reload");
            }

            if (Twitch.storage.get("rightColClosed") === "true") {
                bttvChangeSetting("chatWidth", 0);
                if (bttvJquery("#right_col").width() == "0") {
                    bttvJquery("#right_col").width("340px");
                }
                Twitch.storage.set("rightColClosed", "false");
            }

            if (bttvSettings["chatWidth"] !== null) {
                chatWidth = bttvSettings["chatWidth"];

                if (chatWidth == 0) {
                    bttvJquery("#right_col").css({
                        display: "none"
                    });
                    bttvJquery("#right_close span").css({
                        "background-position": "0 0"
                    });
                } else {
                    bttvJquery("#right_col").width(chatWidth);
                    bttvJquery("#right_col .content #chat").width(chatWidth);
                    bttvJquery("#right_col .content .top").width(chatWidth);

                    bttvJquery("#chat_line_list").width(chatWidth);
                    bttvJquery("#chat_lines").width(chatWidth);
                }

                handleResize();
            } else {
                if (bttvJquery("#right_col").width() == "0") {
                    bttvJquery("#right_col").width("340px");
                }
                chatWidth = bttvJquery("#right_col").width();
                bttvChangeSetting("chatWidth", bttvJquery("#right_col").width());
            }

            bttvJquery(document).mouseup(function (event) {
                if (resize === false) return;
                if (chatWidthStartingPoint) {
                    if (chatWidthStartingPoint === event.pageX) {
                        if (bttvJquery("#right_col").css("display") !== "none") {
                            bttvJquery("#right_col").css({
                                display: "none"
                            });
                            bttvJquery("#right_close span").css({
                                "background-position": "0 0"
                            });
                            chatWidth = 0;
                        }
                    } else {
                        chatWidth = bttvJquery("#right_col").width();
                    }
                } else {
                    chatWidth = bttvJquery("#right_col").width();
                }
                bttvChangeSetting("chatWidth", chatWidth);

                resize = false;
                handleResize();
            });

            bttvJquery("#right_close, #right_col .resizer").mousedown(function (event) {
                resize = event.pageX;
                chatWidthStartingPoint = event.pageX;
                bttvJquery("#chat_text_input").focus();
                if (bttvJquery("#right_col").css("display") === "none") {
                    bttvJquery("#right_col").css({
                        display: "inherit"
                    });
                    bttvJquery("#right_close span").css({
                        "background-position": "0 -18px"
                    });
                    resize = false;
                    if (bttvJquery("#right_col").width() < 340) {
                        bttvJquery("#right_col").width(bttvJquery("#right_col .content .top").width());
                    }
                    chatWidth = bttvJquery("#right_col").width();
                    bttvChangeSetting("chatWidth", chatWidth);
                    handleResize();
                }
            });

            bttvJquery(document).mousemove(function (event) {

                if (resize) {
                    bttvJquery("#chat_text_input").focus();
                    if (chatWidth + resize - event.pageX < 340) {
                        bttvJquery("#right_col").width(340);
                        bttvJquery("#right_col .content #chat").width(340);
                        bttvJquery("#right_col .content .top").width(340);
                        bttvJquery("#chat_line_list").width(340);
                        bttvJquery("#chat_lines").width(340);

                        handleResize();
                    } else if (chatWidth + resize - event.pageX > 541) {
                        bttvJquery("#right_col").width(541);
                        bttvJquery("#right_col .content #chat").width(541);
                        bttvJquery("#right_col .content .top").width(541);
                        bttvJquery("#chat_line_list").width(541);
                        bttvJquery("#chat_lines").width(541);

                        handleResize();
                    } else {
                        bttvJquery("#right_col").width(chatWidth + resize - event.pageX);
                        bttvJquery("#right_col .content #chat").width(chatWidth + resize - event.pageX);
                        bttvJquery("#right_col .content .top").width(chatWidth + resize - event.pageX);
                        bttvJquery("#chat_line_list").width(chatWidth + resize - event.pageX);
                        bttvJquery("#chat_lines").width(chatWidth + resize - event.pageX);

                        handleResize();
                    }
                }
            });

            var resizeTimeout = null;
            bttvJquery(window).off("fluid-resize").on("fluid-resize", function () {
                resizeTimeout = window.setTimeout(handleResize, 500);
            });
            bttvJquery(window).resize(function () {
                bttvJquery(window).trigger('fluid-resize');
            });
        });

    }

    brand = function () {

        bttvDebug.log("Branding Site with Better & Importing Styles");

        // Old Site Header Logo Branding
        if (bttvJquery("#header_logo").length) {
            bttvJquery("#header_logo").html("<img alt=\"TwitchTV\" src=\"http://cdn.betterttv.net/newtwitchlogo.png\">");
            var watermark = document.createElement("div");
            watermark.style.marginTop = "-45px";
            watermark.style.marginLeft = "-8px";
            watermark.innerHTML = "Better";
            watermark.style.color = "#FF0000";
            watermark.style.fontWeight = "bold";
            watermark.style.fontSize = "15px";
            watermark.style.zIndex = "9000";
            watermark.style.opacity = "0.9";
            watermark.style.textShadow = "-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000";
            watermark.style.textDecoration = "none";
            bttvJquery("#header_logo").append(watermark);
        }

        // New Site Logo Branding
        if (bttvJquery("#logo").length) {
            var watermark = document.createElement("div");
            watermark.style.marginTop = "-10px";
            watermark.style.marginLeft = "38px";
            watermark.innerHTML = "Better";
            watermark.style.color = "#FF0000";
            watermark.style.fontWeight = "bold";
            watermark.style.fontSize = "20px";
            watermark.style.textIndent = "0px";
            watermark.style.zIndex = "9000";
            watermark.style.opacity = "0.9";
            watermark.style.textShadow = "-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000";
            watermark.style.textDecoration = "none";
            bttvJquery("#logo").append(watermark);
        }

        // Adds BTTV Settings Icon to Left Sidebar
        bttvJquery(".column .content #you").append('<a class="bttvSettingsIcon" href="#" onclick="betterttvAction(\'openSettings\'); return false;"></a>');

        // Import Global BTTV CSS Changes
        var globalCSSInject = document.createElement("link");
        globalCSSInject.setAttribute("href", "http://cdn.betterttv.net/betterttv.css");
        globalCSSInject.setAttribute("type", "text/css");
        globalCSSInject.setAttribute("rel", "stylesheet");
        bttvJquery("body").append(globalCSSInject);

        // Import Blue Button CSS
        if (bttvSettings["showPurpleButtons"] !== true) {
            cssBlueButtons();
        }

        // Small Popout/Embed Chat Fixes
        bttvJquery("body#chat").css("overflow-y", "hidden");
        bttvJquery('#chat_loading_spinner').attr('src', "data:image/gif;base64,R0lGODlhFgAWAPMGANfX1wAAADc3N1tbW6Ojo39/f2tra8fHx9nZ2RsbG+np6SwsLEtLS4eHh7q6ugAAACH/C05FVFNDQVBFMi4wAwEAAAAh/hoiQ3JlYXRlZCB3aXRoIENoaW1wbHkuY29tIgAh+QQJCgAGACwAAAAAFgAWAAAEbNCESY29OEvBRdDgFXReGI7dZ2oop65YWypIjSgGbSOW/CGAIICnEAIOPdLPSDQiNykDUNgUPn1SZs6ZjE6D1eBVmaVurV1XGXwWp0vfYfv4XpqLaKg6HqbrZzs4OjZ1MBlYhiJkiYWMfy+GEQAh+QQJCgAGACwAAAAAFgAWAAAEctDIKYO9NKe9lwlCKAQZlQzo4IEiWUpnuorjC6fqR7tvjM4tgwJBJN5kuqACwGQef8kQadkEPHMsqbBqNfiwu231CtRSm+Ro7ez04sprbjobH7uR9Kn8Ds2L0XxgSkVGgXA8JV+HNoZqiBocCYuMJX4vEQAh+QQJCgAAACwAAAAAFgAWAAAEcxDISWu4uNLEOwhCKASSGA5AMqxD8pkkIBR0gaqsC4rxXN+s1otXqtlSQR2s+EPmhqGeEfjcRZk06kpJlE2dW+gIe8SFrWNv0yxES9dJ8TsLbi/VdDb3ii/H3WRadl0+eX93hX5ViCaCe2kaKR0ccpGWlREAIfkECQoAAQAsAAAAABYAFgAABHUwyEmrvTisxHlmQigw2mAOiWSsaxMwRVyQy4mqRE64sEzbqYBBt3vJZqVTcKjjHX9KXNPoS5qWRGe1FhVmqTHoVZrThq0377R35o7VZTDSnWbG2XMguYgX1799aFhrT4J7ZnldLC1yfkEXICKOGRcbHY+UlBEAIfkECQoAAQAsAAAAABYAFgAABHIwyEmrvThrOoQXTFYYpFEEQ6EWgkS8rxMUMHGmaxsQR3/INNhtxXL5frPaMGf0AZUooo7nTAqjzN3xecWpplvra/lt9rhjbFlbDaa9RfZZbFPHqXN3HQ5uQ/lmSHpkdzVoe1IiJSZ2OhsTHR8hj5SVFREAIfkECQoAAQAsAAAAABYAFgAABGowyEmrvTjrzWczIJg5REk4QWMShoQAMKAExGEfRLq2QQzPtVtOZeL5ZLQbTleUHIHK4c7pgwqZJWM1eSVmqTGrTdrsbYNjLAv846a9a3PYvYRr5+j6NPDCR9U8FyQmKHYdHiEih4uMjRQRACH5BAkKAAEALAAAAAAWABYAAARkMMhJq7046807d0QYSkhZKoFiIqhzvAchATSNIjWABC4sBznALbfrvX7BYa0Ii81yShrT96xFdbwmEhrALbNUINcrBR+rti7R7BRb1V9jOwkvy38rVmrV0nokICI/f4SFhocSEQAh+QQJCgABACwAAAAAFgAWAAAEWjDISau9OOvNu7dIGCqBIiKkeUoH4AIk8gJIOR/sHM+1cuev3av3C7SCAdnQ9sIZdUke0+U8uoQuYhN4jS592ydSmZ0CqlAyzYweS8FUyQlVOqXmn7x+z+9bIgA7");

        // Run Beta Chat After BTTV CSS
        betaChat();

    }

    betaChat = function () {

        if(typeof PP == "undefined") return;

        if (bttvSettings["bttvChat"] === true) {

            if(bttvJquery("body#chat").length) return;

            bttvDebug.log("Running Beta Chat");

            bttvJquery.getJSON("http://chat.betterttv.net/login.php?onsite=true&user="+Twitch.user.login()+"&callback=?", function(d) {

                if(d.status === true) {
                    bttvDebug.log("Logged into BTTV Chat");
                } else {
                    bttvDebug.log("Not logged into BTTV Chat");
                }

                chatJSInject = document.createElement("script");
                chatJSInject.setAttribute("src", "http://chat.betterttv.net/client/external.php?type=djs");
                chatJSInject.setAttribute("type", "text/javascript");
                bttvJquery("body").append(chatJSInject);

                setTimeout(function() {
                    chatJSInject = document.createElement("script");
                    chatJSInject.setAttribute("src", "http://chat.betterttv.net/client/external.php?type=js");
                    chatJSInject.setAttribute("type", "text/javascript");
                    bttvJquery("body").append(chatJSInject);
                }, 5000);

            });

            var chatCSSInject = document.createElement("link");
            chatCSSInject.setAttribute("href", "http://chat.betterttv.net/client/external.php?type=css");
            chatCSSInject.setAttribute("type", "text/css");
            chatCSSInject.setAttribute("id", "arrowchat_css");
            chatCSSInject.setAttribute("rel", "stylesheet");
            bttvJquery("head").append(chatCSSInject);

            var chatJSInject = document.createElement("script");
            chatJSInject.setAttribute("src", "http://chat.betterttv.net/client/includes/js/jquery.js");
            chatJSInject.setAttribute("type", "text/javascript");
            bttvJquery("body").prepend(chatJSInject);

            bttvJquery("#emoticon-selector-toggle").unbind('click');
            bttvJquery("#right_col .content #twitch_chat .bottom").css("height", parseInt(bttvJquery("#right_col .content #twitch_chat .bottom").height()) + 35);
            bttvJquery("#right_col .content #archives").css("bottom", "30px");

            if(typeof CurrentChat == "undefined" || !CurrentChat.channel) return;

            var n = parseInt(bttvJquery(".chat_box .js-chat-scroll").css("bottom"), 10)+35,
                j = parseInt(bttvJquery("#right_col .content #twitch_chat .bottom").height());
                r = 0;
            bttvJquery("#emoticon-selector-toggle").on("click", function() {
                var t = bttvJquery(".emoticon-selector").outerHeight(!0),
                    i = bttvJquery(".chat_box .emoticon-selector-container");
                bttvJquery(this).toggleClass("selected")
                i.outerHeight() > 0 ? (bttvJquery(".chat_box .js-chat-scroll").animate({ bottom: n }, 200, function() { CurrentChat.scroll_chat() }), i.animate({ height: r }, 200), bttvJquery("#right_col .content #twitch_chat .bottom").animate({ height: j }, 200))
                    : (bttvJquery(".chat_box .js-chat-scroll").animate({ bottom: n + t }, 200, function() { CurrentChat.scroll_chat() }), i.animate({ height: t }, 200), bttvJquery("#right_col .content #twitch_chat .bottom").animate({ height: parseInt(bttvJquery("#right_col .content #twitch_chat .bottom").height()) + t }, 200),
                        bttvJquery(".js-emoticon-selector-scroll").TrackpadScrollEmulator({ wrapContent: !1, scrollbarHideStrategy: "rightAndBottom"})
                    )
            });
            
            bttvJquery(".chat_box .js-chat-scroll").css("bottom", parseInt(bttvJquery(".chat_box .js-chat-scroll").css("bottom")) + 35);
        }

    }

    checkMessages = function () {

        bttvDebug.log("Check for New Messages");

        if(bttvJquery("body#chat").length) return;

        if (Twitch.user.isLoggedIn() && window.Firebase) {
            notificationsLoaded = false;
            notifications = 0;
            var newMessages = function(namespaced) {
                namespaced.child("users/" + Twitch.user.userId() + "/messages").on("value", function (f) {
                    var f = f.val() || {}, j = f.unreadMessagesCount;
                    bttvJquery(".js-unread_message_count").html(j || "");
                    j ? bttvJquery(".js-unread_message_count").show() : bttvJquery(".js-unread_message_count").hide();
                    if (notificationsLoaded === true && notifications < j) {
                        bttvJquery.get('http://www.twitch.tv/inbox', function (data) {
                            var messageSender = /class="capital">(.*)<\/a>/i.exec(data);
                            var messageSenderAvatar = /class="p30" src="(.*)"/i.exec(data);
                            if (messageSender && messageSenderAvatar) {
                                messageSender = messageSender[1].capitalize();
                                messageSenderAvatar = messageSenderAvatar[1];
                            } else {
                                messageSender = "Someone";
                                messageSenderAvatar = "";
                            }
                            bttvJquery.gritter.add({
                                title: 'Message Received',
                                class_name: 'gritter-light',
                                image: messageSenderAvatar,
                                text: messageSender + ' just sent you a Message!<br /><br /><a style="color:black" href="http://www.twitch.tv/inbox">Click here to head to to your inbox</a>.',
                            });
                        });
                    }
                    notifications = j;
                    notificationsLoaded = true;
                    if (notifications > 0 && document.getElementById("header_logo")) {
                        if (document.getElementById("messagescount")) {
                            document.getElementById("messagescount").innerHTML = notifications;
                        } else {
                            messagesnum = document.createElement("a");
                            header_following = document.getElementById("header_following");
                            messagesnum.setAttribute("id", "messagescont");
                            messagesnum.setAttribute("href", "/inbox");
                            messagesnum.setAttribute("class", "normal_button");
                            messagesnum.setAttribute("style", "margin-right: 10px;");
                            messagesnum.innerHTML = "<span id='messagescount' style='padding-left:28px;background-image:url(http://cdn.betterttv.net/messages.png);background-position: 8px 4px;padding-top:-1px;background-repeat: no-repeat;color:black;'>" + notifications + "</span>";
                            header_following.parentNode.insertBefore(messagesnum, header_following);
                        }
                    } else {
                        if (document.getElementById("messagescont")) document.getElementById("messagescont").remove();
                    }
                });
            }
            window.getFirebase().then(function(e) {
                newMessages(e.namespaced)
            });
        }

    }

    cssBlueButtons = function () {

        bttvDebug.log("Turning Purple to Blue");

        var globalCSSInject = document.createElement("style");
        globalCSSInject.setAttribute("type", "text/css");
        globalCSSInject.setAttribute("id", "bttvBlueButtons");
        globalCSSInject.innerHTML = ".game_filter.selected a{background-color:#374a9b!important;}#large_nav .game_filter.selected a {border: #000;background-color: #374a9b !important;}.primary_button:hover,.primary_button:focus {background: linear-gradient(bottom, rgb(42,70,135) 31%, rgb(86,147,232) 80%);background: -o-linear-gradient(bottom, rgb(42,70,135) 31%, rgb(86,147,232) 80%);background: -moz-linear-gradient(bottom, rgb(42,70,135) 31%, rgb(86,147,232) 80%);background: -webkit-linear-gradient(bottom, rgb(42,70,135) 31%, rgb(86,147,232) 80%);background: -ms-linear-gradient(bottom, rgb(42,70,135) 31%, rgb(86,147,232) 80%);}.primary_button {border-color: #000 !important;background: linear-gradient(bottom, rgb(41,59,148) 31%, rgb(54,127,235) 80%);background: -o-linear-gradient(bottom, rgb(41,59,148) 31%, rgb(54,127,235) 80%);background: -moz-linear-gradient(bottom, rgb(41,59,148) 31%, rgb(54,127,235) 80%);background: -webkit-linear-gradient(bottom, rgb(41,59,148) 31%, rgb(54,127,235) 80%);background: -ms-linear-gradient(bottom, rgb(41,59,148) 31%, rgb(54,127,235) 80%);}#team_member_list .page_links a {color: #374a9b !important;}#team_member_list .page_links a b.left {border-left-color: #374a9b !important;}#team_member_list .page_links a b.right {border-left-color: #374a9b !important;}";
        bttvJquery("body").append(globalCSSInject);

    }

    directoryLiveTab = function () {

        if(bttvSettings["showDirectoryLiveTab"] === true && bttvJquery('h2.title:contains("Channels You Follow")').length && bttvJquery('a.active:contains("Overview")').length) {

            bttvDebug.log("Changing Directory View");

            bttvJquery('a:contains("Live Channels")').click();

        }

    }

    chatFunctions = function () {

        if (!document.getElementById("chat_lines")) return;

        bttvDebug.log("Modifying Chat Functionality");

        if(typeof CurrentChat == "undefined" || !CurrentChat.channel) return;

        CurrentChat.admin_message("<center><small>BetterTTV v" + bttvVersion + " Loaded.</small></center>");

        if (bttvSettings["scrollbackAmount"]) {
            CurrentChat.line_buffer = bttvSettings["scrollbackAmount"];
        }

        Chat.prototype.insert_chat_lineOld = Chat.prototype.insert_chat_line;
        Chat.prototype.insert_chat_line = function (info) {
            if (currentViewers.indexOf(info.nickname) === -1 && info.nickname !== "jtv" && info.nickname !== "twitchnotify") {
                currentViewers.push(info.nickname);
            }

            if (CurrentChat.currently_scrolling) {
                setTimeout(function () {
                    bttvJquery("#chat_lines").scrollTop(bttvJquery("#chat_lines")[0].scrollHeight);
                }, 1000);
            }

            if (CurrentChat.checkMods && info.nickname === "jtv") {
                var modsRegex = /^The moderators of this room are:(.*)/,
                    mods = modsRegex.exec(info.message);
                if (mods) {
                    CurrentChat.checkingMods = false;
                    mods = mods[1].trim().split(", ");
                    mods.push(CurrentChat.channel);
                    mods.forEach(function (mod) {
                        if(!CurrentChat.moderators[mod]) {
                            var action = {
                                sender: "jtv",
                                target: mod
                            }
                            fakeCurrentChat("user_oped", action);
                            bttvDebug.log("Added "+mod+" as a mod");
                        }
                    });
                    for (mod in CurrentChat.moderators) {
                        if(CurrentChat.moderators.hasOwnProperty(mod)) {
                            if(mods.indexOf(mod) === -1) {
                               var action = {
                                    sender: "jtv",
                                    target: mod
                                }
                                fakeCurrentChat("user_deoped", action);
                                bttvDebug.log("Removed "+mod+" as a mod"); 
                            }
                        }
                    }
                    var time = new Date().getTime() / 1000;
                    CurrentChat.lastActivity = time;
                    CurrentChat.setup_chat_settings_menu();
                    CurrentChat.last_sender = "jtv";
                    return;
                }
            } else if(info.nickname === "jtv") {
                var modsRegex = /^The moderators of this room are:/,
                    mods = info.message.match(modsRegex);
                if (mods) {
                    CurrentChat.checkMods = true;
                }
            }

            var time = new Date().getTime() / 1000;
            CurrentChat.lastActivity = time;

            if (info.nickname == "nightbot" && info.message == "> Running a commercial in 15 seconds." && Twitch.user.login() === CurrentChat.channel) {
                bttvJquery.gritter.add({
                    title: 'Commercial Warning',
                    class_name: 'gritter-light',
                    time: 10000,
                    image: 'http://cdn.nightdev.com/img/nightboticon.png',
                    text: 'Nightbot will be running a commercial in 15 seconds.',
                });
            }

            if (info.tagtype == "broadcaster") {
                info.tagname = "Host";
            }

            if (CurrentChat.trackTimeouts && CurrentChat.trackTimeouts[info.nickname]) {
                delete CurrentChat.trackTimeouts[info.nickname];
            }

            var x = 0;
            if (info.tagtype == "mod" || info.tagtype == "broadcaster" || info.tagtype == "admin") x = 1;

            var messageHighlighted = false,
                highlightKeywords = [],
                blacklistKeywords = [];

            if (bttvSettings["blacklistKeywords"]) {
                var keywords = bttvSettings["blacklistKeywords"];
                var phraseRegex = /\{.+?\}/g;
                var testCases =  keywords.match(phraseRegex);
                if(testCases) {
                    for (i=0;i<testCases.length;i++) {
                        var testCase = testCases[i];
                        keywords = keywords.replace(testCase, "").replace(/\s\s+/g, ' ').trim();
                        blacklistKeywords.push(testCase.replace(/(^\{|\}$)/g, '').trim());
                    }
                }
                if(keywords !== "") {
                    keywords = keywords.split(" ");
                    keywords.forEach(function (keyword) {
                        blacklistKeywords.push(keyword);
                    });
                }
            }

            if (bttvSettings["highlightKeywords"]) {
                var extraKeywords = bttvSettings["highlightKeywords"];
                var phraseRegex = /\{.+?\}/g;
                var testCases =  extraKeywords.match(phraseRegex);
                if(testCases) {
                    for (i=0;i<testCases.length;i++) {
                        var testCase = testCases[i];
                        extraKeywords = extraKeywords.replace(testCase, "").replace(/\s\s+/g, ' ').trim();
                        highlightKeywords.push(testCase.replace(/(^\{|\}$)/g, '').trim());
                    }
                }
                if(extraKeywords !== "") {
                    extraKeywords = extraKeywords.split(" ");
                    extraKeywords.forEach(function (keyword) {
                        highlightKeywords.push(keyword);
                    });
                }
            }

            if (Twitch.user.login() && bttvSettings["selfHighlights"] !== false) {
                highlightKeywords.push(Twitch.user.login());
            }

            var filtered = false;
            blacklistKeywords.forEach(function (keyword) {
                keyword = escapeRegExp(keyword).replace(/\*/g, "[^ ]*");
                var blacklistRegex = new RegExp(keyword, 'i');
                if (blacklistRegex.test(info.message) && Twitch.user.login() !== info.nickname) {
                    info.message = "&lt;message filtered&gt;";
                    filtered = true;
                }
            });
            if(bttvSettings["hideDeletedMessages"] === true && filtered) return;

            highlightKeywords.forEach(function (keyword) {
                keyword = escapeRegExp(keyword).replace(/\*/g, "[^ ]*");
                var wordRegex = new RegExp('(\\b|\\s|^)' + keyword + '(\\b|\\s|$)', 'i');
                var nickRegex = new RegExp('^' + keyword + '$', 'i');
                if (Twitch.user.login() !== "" && (((wordRegex.test(info.message) || nickRegex.test(info.nickname)) && Twitch.user.login() !== info.nickname) || (Twitch.user.login() === info.nickname && bttvSettings["highlightKeywords"] && bttvSettings["highlightKeywords"].indexOf(Twitch.user.login()) !== -1))) {
                    messageHighlighted = true;
                }
            });

            if(info.color === "black") info.color = "#000000";
            if(info.color === "MidnightBlue") info.color = "#191971";

            var colorRegex = /^#[0-9a-f]+$/i;
            if(colorRegex.test(info.color)) {
                while (((calculateColorBackground(info.color) === "light" && bttvSettings["darkenedMode"] === true) || (calculateColorBackground(info.color) === "dark" && bttvSettings["darkenedMode"] !== true)) && Twitch.user.login() !== info.nickname) {
                    info.color = calculateColorReplacement(info.color, calculateColorBackground(info.color));
                }
            }

            if (blackChat && info.color === "#000000") {
                info.color = "#ffffff";
            }

            if (messageHighlighted === true && bttvSettings["darkenedMode"] === true) {
                info.color = "#ffffff";
                ich.templates["chat-line"] = ich.templates["chat-line-highlight"];
                ich.templates["chat-line-action"] = ich.templates["chat-line-action-highlight"];
            } else if (messageHighlighted === true && Twitch.user.login() !== "") {
                info.color = "#000000";
                ich.templates["chat-line"] = ich.templates["chat-line-highlight"];
                ich.templates["chat-line-action"] = ich.templates["chat-line-action-highlight"];
            } else {
                ich.templates["chat-line"] = ich.templates["chat-line-old"];
                ich.templates["chat-line-action"] = ich.templates["chat-line-action-old"];
            }

            //Bots
            if(info.sender == "moobot" && x==1) { info.tagtype="bot"; info.tagname = "Bot"; }
            if(info.sender == "nightbot" && x==1) { info.tagtype="bot"; info.tagname = "Bot"; }
            if(info.sender == "sourbot" && x==1) { info.tagtype="bot"; info.tagname = "Bot"; }
            if(info.sender == "xanbot" && x==1) { info.tagtype="bot"; info.tagname = "Bot"; }
            if(info.sender == "mtgbot" && x==1) { info.tagtype="bot"; info.tagname = "Bot"; }
            if(info.sender == "ackbot" && x==1) { info.tagtype="bot"; info.tagname = "Bot"; }
            if(info.sender == "bullystopper" && x==1) { info.tagtype="bot"; info.tagname = "Bot"; }
            if(info.sender == "baconrobot" && x==1) { info.tagtype="bot"; info.tagname = "Bot"; }
            if(info.sender == "tardisbot" && x==1) { info.tagtype="bot"; info.tagname = "Bot"; }

            if(info.nickname === info.sender) {
                info.nickname = CurrentChat.lookupDisplayName(info.sender);
            } else {
                CurrentChat.lookupDisplayName(info.sender);
            }
            
            //this.insert_chat_lineOld(info);
            if (info.message.substr(0, 3).trim() === "/me") {
                info.message = info.message.substr(4);
            }

            if (!(CurrentChat.restarting && !CurrentChat.history_ended || CurrentChat.ignored[info.sender]))
                if ("jtv" === info.sender) CurrentChat.last_sender = info.sender, CurrentChat.admin_message(CurrentChat.format_message(info));
                else if ("twitchnotify" === info.sender) CurrentChat.last_sender = info.sender, CurrentChat.notify_message("subscriber", CurrentChat.format_message(info));
                else if (!info.is_action && !messageHighlighted && CurrentChat.last_sender && CurrentChat.last_sender === info.sender && "jtv" !== CurrentChat.last_sender) CurrentChat.insert_with_lock("#chat_line_list li:last", '<p class="chat_line" style="display:block;" data-raw="'+encodeURIComponent(info.message.replace(/%/g,""))+'">&raquo; ' + CurrentChat.format_message(info) + "</p>");
            else {
                CurrentChat.last_sender = info.sender;
                var d = !! (Twitch.user.login() === CurrentChat.channel || CurrentChat.userData && (CurrentChat.userData.is_staff || CurrentChat.userData.is_admin) || CurrentChat.staff[Twitch.user.login()] || CurrentChat.admins[Twitch.user.login()] || CurrentChat.moderators[Twitch.user.login()]),
                    c = info.is_action ? "chat-line-action" : "chat-line",
                    b = !1,
                    f = unescape(info.nickname);
                0 === f.indexOf("ign-") && (b = !0, f = f.substr(4));
                if (CurrentChat.moderators[info.sender]) {
                    if (CurrentChat.channel === Twitch.user.login()) {
                        var showThem = true;
                    } else {
                        var showThem = false;
                    }
                } else {
                    var showThem = true
                }
                if(bttvSettings["showModIcons"] == null) bttvChangeSetting("showModIcons", true);
                if(bttvSettings["showTimestamps"] == null) bttvChangeSetting("showTimestamps", true);
                var h = "chat-line-" + Math.round(1E9 * Math.random()),
                    f = {
                        id: h,
                        showModButtons: d && "jtv" !== info.sender && info.sender !== Twitch.user.login() && bttvSettings["showModIcons"] && showThem,
                        timestamp: bttvSettings["showTimestamps"] || !CurrentChat.history_ended ? info.timestamp : "",
                        sender: info.sender,
                        displayname: f,
                        color: info.color
                    }, g = d = "";
                info.tagtype && (d = '<span class="tag %tagtype">%tagname</span>&nbsp;'.replace(/\%tagtype/g,
                    info.tagtype).replace(/\%tagname/g, info.tagname));
                info.turbo && (d += '<span class="tag %tagtype" title="%tagname"><a href="/products/turbo?ref=chat_badge" target="_blank">%tagname</a></span> '.replace(/\%tagtype/g, "turbo").replace(/\%tagname/g, "Turbo"));
                info.subscriber && (g = '<span class="tag %tagtype c%tagchannel" title="%tagname">' + ('<a href="/' + CurrentChat.channel + '/subscribe" target="_blank">%tagname</a>'), d += (g + "</span> ").replace(/\%tagtype/g, "subscriber").replace(/\%tagname/g, "Subscriber").replace(/\%tagchannel/g, CurrentChat.channel));
                b && (d += '<span class="tag %tagtype" title="%tagname">%tagname</span>&nbsp;'.replace(/\%tagtype/g, "ign").replace(/\%tagname/g, "My IGN"));
                c = ich[c](f)[0].outerHTML;
                c = c.replace(/\@raw/g, encodeURIComponent(info.message.replace(/%/g,"")));
                c = c.replace(/\@tag/g, d);
                c = c.replace(/\@message/g, CurrentChat.format_message(info));
                "jtv" !== info.sender ? CurrentChat.insert_with_lock("#chat_line_list", c, info, h) : CurrentChat.insert_with_lock("#chat_line_list", c);
                setTimeout(function () {
                    bttvJquery("#" + h).click(function () {
                        setTimeout(function () {
                            bttvJquery("#chat_viewers_dropmenu").css("display", "none");
                        }, 100);
                    });
                }, 500);
            }
        }

        ich.templates["chat-line-action"] = '<li class="chat_from_{{sender}} line" data-sender="{{sender}}"><p><span class="small">{{timestamp}}&nbsp;</span>{{#showModButtons}}{{> chat-mod-buttons}}{{/showModButtons}}@tag<a class="nick" href="/{{sender}}" id="{{id}}" style="color:{{color}};">{{displayname}}</a> <span class="chat_line" style="color:{{color}};" data-raw="@raw">@message</span></p></li>';
        ich.templates["chat-line-action-highlight"] = '<li class="chat_from_{{sender}} line highlight" data-sender="{{sender}}"><p><span class="small">{{timestamp}}&nbsp;</span>{{#showModButtons}}{{> chat-mod-buttons}}{{/showModButtons}}@tag<a class="nick" href="/{{sender}}" id="{{id}}" style="color:{{color}};">{{displayname}}</a> <span class="chat_line" style="color:{{color}};" data-raw="@raw">@message</span></p></li>';
        ich.templates["chat-line"] = '<li class="chat_from_{{sender}} line" data-sender="{{sender}}"><p><span class="small">{{timestamp}}&nbsp;</span>{{#showModButtons}}{{> chat-mod-buttons}}{{/showModButtons}}@tag<a class="nick" href="/{{sender}}" id="{{id}}" style="color:{{color}};">{{displayname}}</a>:&nbsp;<span class="chat_line" data-raw="@raw">@message</span></p></li>';
        ich.templates["chat-line-highlight"] = '<li class="chat_from_{{sender}} line highlight" data-sender="{{sender}}"><p><span class="small">{{timestamp}}&nbsp;</span>{{#showModButtons}}{{> chat-mod-buttons}}{{/showModButtons}}@tag<a class="nick" href="/{{sender}}" id="{{id}}" style="color:{{color}};">{{displayname}}</a>:&nbsp;<span class="chat_line" data-raw="@raw">@message</span></p></li>';
        ich.templates["chat-line-old"] = ich.templates["chat-line"];
        ich.templates["chat-line-action-old"] = ich.templates["chat-line-action"];

        var purge = '<span><a href="#" class="normal_button tooltip chat_menu_btn bttvTimeout" data-time="1" title="Purges Users Chat - 1 Second Timeout"><span class="glyph_only"><img src="http://cdn.betterttv.net/purge.png" /></span></a>&nbsp;</span>';
        bttvJquery(purge).insertBefore("#chat_menu_timeout");
        var permit = '<span><a href="#" class="normal_button tooltip chat_menu_btn bttvPermit" title="!permit a user to post a link - Functions with bots like Moobot or Nightbot"><span class="glyph_only"><img src="http://cdn.betterttv.net/permit.png" /></span></a>&nbsp;</span>';
        bttvJquery(permit).insertBefore(".bttvTimeout");
        var tempBan = '<span>&nbsp;<a href="#" class="normal_button tooltip chat_menu_btn bttvTimeout" data-time="28800" title="Temporary 8 hour ban"><span class="glyph_only"><img src="http://cdn.betterttv.net/8hr.png" /></span></a></span><span>&nbsp;<a href="#" class="normal_button tooltip chat_menu_btn bttvTimeout" data-time="86400" title="Temporary 24 hour ban"><span class="glyph_only"><img src="http://cdn.betterttv.net/24hr.png" /></span></a></span>';
        bttvJquery(tempBan).insertAfter("#chat_menu_timeout");
        bttvJquery("#chat_menu_tools").insertAfter("#chat_menu_op_tools");

        bttvJquery(".bttvTimeout").each(function() {
            bttvJquery(this).click(function() {
                var time = bttvJquery(this).data("time"),
                    user = bttvJquery("#user_info .nick").html().toLowerCase();
                ga('send', 'event', 'Chat', 'Send Timeout: ' + time);
                CurrentChat.say("/timeout " + user + " " + time);
            });
        });

        bttvJquery(".bttvPermit").click(function () {
            var user = bttvJquery("#user_info .nick").html().toLowerCase();
            ga('send', 'event', 'Chat', 'Send Permit');
            CurrentChat.say("!permit " + user);
        });

        CurrentChat.TMIFailedToJoin = true;
        CurrentChat.TMIFailedToJoinTries = 1;
        CurrentChat.checkModsViaCommand = true;

        CurrentChat.linkify_re = /(\b\x02?((?:https?:\/\/|[\w\-\.\+]+@)?\x02?(?:[\w\-]+\x02?\.)+\x02?(?:com|au|org|tv|net|info|jp|uk|us|cn|fr|mobi|gov|co|ly|me|vg|eu|ca|fm|am|ws)\x02?(?:\:\d+)?\x02?(?:\/[\w\.\/@\?\&\%\#\(\)\,\-\+\=\;\:\x02?]+\x02?[\w\/@\?\&\%\#\(\)\=\;\x02?]|\x02?\w\x02?|\x02?)?\x02?)\x02?\b|(?:(?:https?|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?!10(?:\.\d{1,3}){3})(?!127(?:\.\d{1,3}){3})(?!169\.254(?:\.\d{1,3}){2})(?!192\.168(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9]+-?)*[a-z0-9]+)(?:\.(?:[a-z0-9]+-?)*[a-z0-9]+)*(?:\.(?:[a-z]{2,})))(?::\d{2,5})?(?:\/[^\s]*)?)/gi

        bttvJquery(document).on('dblclick', '.chat_line', function() {
            CurrentChat.translate(this, bttvJquery(this).data("raw"));
            bttvJquery(this).html("Translating..");
        });

        CurrentChat.translate = function(element, text) {
            var language = window.location.host.split('.')[0].replace(/^(www|beta)$/,"en"),
                query = "http%3A%2F%2Ftranslate.google.com%2Ftranslate_a%2Ft%3Fclient%3Dgtranslate%26sl%3Dauto%26tl%3D"+language+"%26text%3D"+(encodeURIComponent(text)),
                translate = "http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20json%20where%20url%3D\""+query+"\"&format=json&diagnostics=false&callback=?";

            bttvJquery.ajax({
                url: translate,
                cache: !1,
                timeoutLength: 6E3,
                dataType: 'json',
                success: function (data) {
                    if(data.error) {
                        bttvJquery(element).html("Translation Error");
                    } else {
                        var sentences = data.query.results.json.sentences;
                        if(sentences instanceof Array) {
                            var translation = "";
                            sentences.forEach(function(sentence) {
                                translation += sentence.trans;
                            });
                            bttvJquery(element).html(escape_html(translation));
                        } else {
                            var translation = sentences.trans;
                            bttvJquery(element).html(escape_html(translation));
                        }
                        CurrentChat.scroll_chat();
                    }
                },
                error: function() {
                    bttvJquery(element).html("Translation Error: Server Error");
                }
            });
        }

        CurrentChat.notify_message = function (type, message) {
            if (type === "subscriber") {
                var subIcon = '<span class="tag subscriber c'+CurrentChat.channel+'" title="Subscriber"><a href="/'+CurrentChat.channel+'/subscribe" target="_blank">Subscriber</a></span>&nbsp;&nbsp;';
                var msg = '<li class="line"><p>'+subIcon+'<span class="chat_line fromtwitchnotify">' + message + "</span></p></li>";
            } else {
                var icon = '<span class="tag '+type+'">'+type.capitalize()+'</span>&nbsp;&nbsp;';
                var msg = '<li class="line"><p>'+icon+'<span class="chat_line fromtwitchnotify">' + message + "</span></p></li>";
            }
            this.last_sender = "twitchnotify", this.insert_with_lock("#chat_line_list", msg)
        }

        CurrentChat.chat_say_old = CurrentChat.chat_say;
        CurrentChat.chat_say = function (message) {
            var n = message || bttvJquery("#chat_text_input")[0],
            r = n.value;
            if(bttvSettings["antiPrefix"] === true && CurrentChat.autoCompleteEmotes) {
                var existingEmotes = [];
                CurrentChat.emoticons.forEach(function(emote) {
                    existingEmotes.push(""+emote.regex);
                });
                for(var emote in CurrentChat.autoCompleteEmotes) {
                    if(CurrentChat.autoCompleteEmotes.hasOwnProperty(emote) && existingEmotes.indexOf("/\\b"+emote+"\\b/g") === -1) {
                        var emoteRegex = new RegExp("\\b"+emote+"\\b","g");
                        r = r.replace(emoteRegex, CurrentChat.autoCompleteEmotes[emote]);
                    }
                }
            }
            bttvJquery("#chat_text_input").val(r);
            if(!CurrentChat.sentHistory) CurrentChat.sentHistory = [];
            if(CurrentChat.sentHistory.indexOf(r) !== -1) {
                CurrentChat.sentHistory.splice(CurrentChat.sentHistory.indexOf(r), 1);
            }
            if(r.trim() === "/mods" || r.trim() === ".mods") CurrentChat.checkMods = false;
            if(r.trim() === "/massunban" || r.trim() === ".massunban") {
                CurrentChat.massUnban();
                bttvJquery("#chat_text_input").val("");
                return;
            }
            CurrentChat.sentHistory.unshift(r);
            CurrentChat.chat_say_old.call(CurrentChat, message);
        }

        CurrentChat.say_old = CurrentChat.say;
        CurrentChat.linesInPast30s = 0;
        CurrentChat.say = function(e, t) {
            bttvDebug.log("Attempting to send chat: "+e);
            if(CurrentChat.linesInPast30s >= 19) {
                CurrentChat.admin_message("BetterTTV: To prevent a Twitch global chat ban, outgoing commands/messages are blocked for "+(31-(Math.round(new Date().getTime()/1000)-CurrentChat.linesInPast30sTime))+" more seconds.");
                return;
            } else if(CurrentChat.linesInPast30s === 0) {
                CurrentChat.linesInPast30sTime = Math.round(new Date().getTime()/1000);
                setTimeout(function(){ CurrentChat.linesInPast30s = 0; }, 31000);
            }
            if(Twitch.user.login() && Twitch.user.login() in CurrentChat.moderators) {
                bttvDebug.log("Sending chat: "+e);
                CurrentChat.say_old.call(CurrentChat, e, t);
                CurrentChat.linesInPast30s++;
            } else {
                var currentTime = new Date().getTime();
                if(CurrentChat.lastSpokenTime && currentTime-CurrentChat.lastSpokenTime < 2100) {
                    var spamDifference = 2100-(currentTime-CurrentChat.lastSpokenTime);
                    setTimeout(function() {
                        bttvDebug.log("Sending chat: "+e);
                        CurrentChat.say_old.call(CurrentChat, e, t);
                    }, spamDifference);
                    CurrentChat.lastSpokenTime = currentTime+spamDifference;
                } else {
                    bttvDebug.log("Sending chat: "+e);
                    CurrentChat.say_old.call(CurrentChat, e, t);
                    CurrentChat.lastSpokenTime = currentTime;
                }
            }
        }

        var unbannedUsers = [];
        CurrentChat.massUnban = function() {
            if(Twitch.user.login() && Twitch.user.login() == CurrentChat.channel) {
                var bannedUsers = [];
                CurrentChat.admin_message("Fetching banned users...");
                bttvJquery.ajax({url: "/settings/chat", cache: !1, timeoutLength: 6E3, dataType: 'html'}).done(function (chatInfo) {
                    if(chatInfo) {
                        bttvJquery(chatInfo).find("#banned_chatter_list .ban .obj").each(function() {
                            var user = bttvJquery(this).html().trim();
                            if(unbannedUsers.indexOf(user) === -1 && bannedUsers.indexOf(user) === -1) bannedUsers.push(user);
                        });
                        if(bannedUsers.length > 0) {
                            CurrentChat.admin_message("Fetched "+bannedUsers.length+" banned users.");
                            if(bannedUsers.length > 10) {
                                CurrentChat.admin_message("Starting purge process in 5 seconds. Get ready for a spam fest!");
                            } else {
                                CurrentChat.admin_message("Starting purge process in 5 seconds.");
                            }
                            CurrentChat.admin_message("By my calculations, this block of users will take "+((bannedUsers.length*2.1)/60).toFixed(2)+" minutes to unban.");
                            if(bannedUsers.length > 70) CurrentChat.admin_message("Twitch only provides up to 80 users at a time, but this script will cycle through all of the blocks of users.");
                            setTimeout(function() {
                                if(Twitch.user.login() in CurrentChat.moderators) delete CurrentChat.moderators[Twitch.user.login()];
                                bannedUsers.forEach(function(user) {
                                    CurrentChat.say("/unban "+user);
                                    unbannedUsers.push(user);
                                });
                                CurrentChat.moderators[Twitch.user.login()] = true;
                                var currentTime = new Date().getTime(),
                                    spamDifference = 2100-(currentTime-CurrentChat.lastSpokenTime);
                                setTimeout(function() {
                                    CurrentChat.admin_message("This block of users has been purged. Checking for more..");
                                    CurrentChat.massUnban();
                                }, spamDifference);
                            }, 5000);
                        } else {
                            CurrentChat.admin_message("You have no banned users.");
                            unbannedUsers = [];
                        }
                    }
                });
            } else {
                CurrentChat.admin_message("You're not the channel owner.");
            }
        }

        CurrentChat.lookupDisplayName = function (user) {
            if(user === null || user === "") return;
            if(!CurrentChat.displayNames) CurrentChat.displayNames = {};
            if(!CurrentChat.lookingUpUsers) CurrentChat.lookingUpUsers = 0;
            if(CurrentChat.displayNames[user]) {
                return CurrentChat.displayNames[user];
            } else if(user !== "jtv" && user !== "twitchnotify") {
                if(CurrentChat.lookingUpUsers < 2) {
                    CurrentChat.lookingUpUsers++;
                    ga('send', 'event', 'Chat', 'Lookup Display Name');
                    Twitch.api.get("users/" + user).done(function (d) {
                        if(d.display_name && d.name) {
                            CurrentChat.displayNames[d.name] = d.display_name;
                            bttvJquery('#chat_line_list .chat_from_' + d.name.replace(/%/g, '_').replace(/[<>,]/g, '') + ' .nick').each(function () {
                                bttvJquery(this).html(d.display_name);
                            });
                        }
                        CurrentChat.lookingUpUsers--;
                    });
                }
                return user.capitalize();
            } else {
                return user;
            }
        }
        CurrentChat.lookupDisplayName(Twitch.user.login());
        CurrentChat.lookupDisplayName(CurrentChat.channel);

        CurrentChat.handlers.user_names_end = function () {
            clearTimeout(CurrentChat.checkJoinFail);
            CurrentChat.TMIFailedToJoin = false;
            CurrentChat.retries = 10;
            CurrentChat.admin_message(i18n("Welcome to " + CurrentChat.lookupDisplayName(CurrentChat.channel) + "'s chat room!"));
            overrideEmotes();
            bttvJquery("#chat_loading_spinner")[0].style.display = "none";
            CurrentChat.specialUserAlert = false;
            setTimeout(function(){ CurrentChat.specialUserAlert = true }, 20000);
            if(CurrentChat.checkModsViaCommand === true) {
                if(Twitch.user.login()) {
                    CurrentChat.checkingMods = true;
                    CurrentChat.checkMods = true;
                    CurrentChat.last_sender = Twitch.user.login();
                    CurrentChat.say("/mods");
                }
            }
        }

        CurrentChat.handlers.emote_sets = function (d) {
            var emoteSets = JSON.parse(d.sets),
                user = d.user;

            if(!CurrentChat.user_to_emote_sets[user]) CurrentChat.user_to_emote_sets[user] = [];
            emoteSets.forEach(function (set) {
                if(CurrentChat.user_to_emote_sets[user].indexOf(set) === -1) {
                    CurrentChat.user_to_emote_sets[user].push(set);
                }
            });
        }

        CurrentChat.handlers.error = function () {
            CurrentChat.admin_message(i18n("BetterTTV: Chat encountered an error.."));
            CurrentChat.admin_message(i18n("BetterTTV: Reconnecting.."));
            CurrentChat.reconnect();
        }

        CurrentChat.handlers.debug = function (a) {
            CurrentChat.debug && CurrentChat.admin_message("DEBUG: " + a.message);
            if (a.message.match(/^Connecting to (.*):(80|443|6667)$/)) {
                CurrentChat.currentServer = /^Connecting to ((.*):(80|443|6667))$/.exec(a.message)[1];
            }
            if (a.message.match(/^connected$/)) {
                CurrentChat.admin_message(i18n("Connected to the chat server."));
            }
            if (a.message === "Received irc message IRCMessage from 'null' to 'null', with command 'PING' and message 'null'") {
                var time = new Date().getTime() / 1000;
                CurrentChat.lastActivity = time;
                CurrentChat.monitorActivity = true;
            }
            if (bttvSettings["adminStaffAlert"] === true) {
                var isUserAdminOrStaff = /Received irc message IRCMessage from 'jtv' to '[a-z0-9_]+', with command 'PRIVMSG' and message 'SPECIALUSER ([a-z0-9_]+) (admin|staff)'/.exec(a.message);
                if (isUserAdminOrStaff) {
                    if(CurrentChat.specialUserAlert) {
                        var user = CurrentChat.lookupDisplayName(isUserAdminOrStaff[1]),
                            type = isUserAdminOrStaff[2],
                            msg = user+" just joined! Watch out foo!";
                        if (bttvSettings["showDefaultTags"] !== true) type = "old"+type;
                        CurrentChat.last_sender = "twitchnotify";
                        CurrentChat.notify_message(type, msg);
                    }
                }
            }
            if (a.message.match(/^Connection lost/)) {
                if (CurrentChat.silence && CurrentChat.silence === true) {
                    CurrentChat.silence = false;
                    return;
                }
                if (CurrentChat.last_sender === Twitch.user.login()) {
                    if (CurrentChat.checkingMods === true) {
                        CurrentChat.checkModsViaCommand = false;
                        CurrentChat.checkingMods = false;
                        CurrentChat.admin_message(i18n("BetterTTV: You may possibly be global banned from chat."));
                    }
                    if (CurrentChat.globalBanAttempt && CurrentChat.globalBanAttempt >= 1) {
                        CurrentChat.admin_message(i18n("BetterTTV: You were disconnected from chat."));
                        CurrentChat.admin_message(i18n("BetterTTV: You may be globally banned from chat for 8 hours (if you sent 20 lines in 30 seconds)."));
                        CurrentChat.admin_message(i18n("BetterTTV: If this is true you can still see chat, but talking will disconnect you."));
                        CurrentChat.admin_message(i18n("BetterTTV: Reconnecting anyways.."));
                        CurrentChat.TMIFailedToJoin = true;
                        CurrentChat.TMIFailedToJoinTries = 1;
                    } else {
                        CurrentChat.admin_message(i18n("BetterTTV: You were disconnected from chat."));
                        CurrentChat.admin_message(i18n("BetterTTV: Reconnecting.."));
                        CurrentChat.TMIFailedToJoin = true;
                        CurrentChat.TMIFailedToJoinTries = 1;
                        if (!CurrentChat.globalBanAttempt) CurrentChat.globalBanAttempt = 0;
                        CurrentChat.globalBanAttempt++;
                    }
                } else {
                    CurrentChat.admin_message(i18n("BetterTTV: You were disconnected from chat."));
                    CurrentChat.admin_message(i18n("BetterTTV: Reconnecting.."));
                    CurrentChat.TMIFailedToJoin = true;
                    CurrentChat.TMIFailedToJoinTries = 1;
                    bttvJquery.getJSON("http://twitchstatus.com/api/report?type=chat&kind=disconnect&server=" + /^Connection lost to \(((.*):(80|443|6667))\)/.exec(a.message)[1]);
                }
            }
        }

        setInterval(function () {
            if (CurrentChat.monitorActivity) {
                var time = new Date().getTime() / 1000,
                    timeDifference = time - CurrentChat.lastActivity;
                if (timeDifference >= 360) {
                    CurrentChat.monitorActivity = false;
                    CurrentChat.admin_message(i18n("BetterTTV: I suspect your chat froze.."));
                    CurrentChat.admin_message(i18n("BetterTTV: Reconnecting.."));
                    CurrentChat.TMIFailedToJoin = true;
                    CurrentChat.TMIFailedToJoinTries = 1;
                    CurrentChat.reconnect();
                }
            }
        }, 5000)

        CurrentChat.rejoinChat = function () {

            if (!CurrentChat.currentServer) {
                var a = CurrentChat.ircSystem.cloneNode(!0);
                CurrentChat.ircSystem.parentNode.replaceChild(a, CurrentChat.ircSystem);
                CurrentChat.ircSystem = a;
                CurrentChat.me.is_loaded = !1;
                CurrentChat.connect(CurrentChat.room)
                CurrentChat.silence = true;
                CurrentChat.admin_message(i18n("BetterTTV: Trying a different server"));
            }
            if (CurrentChat.TMIFailedToJoinTries <= 10) {
                CurrentChat.admin_message(i18n("BetterTTV: Attempting to join again.. [" + CurrentChat.TMIFailedToJoinTries + "/10]"));
                CurrentChat.ircSystem.join("#" + CurrentChat.channel);
                CurrentChat.checkJoinFail = setTimeout(function () {
                    if (CurrentChat.TMIFailedToJoin === true) {
                        CurrentChat.admin_message(i18n("BetterTTV: Unable to join the chat room.."));
                        CurrentChat.rejoinChat();
                    }
                }, 10000);
                CurrentChat.TMIFailedToJoinTries++;
                bttvJquery.getJSON("http://twitchstatus.com/api/report?type=chat&kind=join&server=" + CurrentChat.currentServer);
            } else {
                CurrentChat.admin_message(i18n("BetterTTV: Looks like chat is broken.. I give up. :("));
            }

        }

        CurrentChat.handlers.connected = function () {
            CurrentChat.checkJoinFail = setTimeout(function () {
                if (CurrentChat.TMIFailedToJoin === true) {
                    CurrentChat.admin_message(i18n("BetterTTV: Unable to join the chat room.."));
                    CurrentChat.rejoinChat();
                }
            }, 10000);

            CurrentChat.admin_message(i18n("Joining the chat room.."));
            CurrentChat.join_on_connect && CurrentChat.join(CurrentChat.join_on_connect);
            CurrentChat.join_on_connect = null;
            $("chat_line_list").innerHTML = "";
            CurrentChat.line_count = 0;
            $("chat_text_input").disabled = !1;
            CurrentChat.debug && CurrentChat.ircSystem.debugOn();
        }

        CurrentChat.handlers.clear_chat = function (info) {
            if (!CurrentChat.trackTimeouts) CurrentChat.trackTimeouts = {};
            var nickname = CurrentChat.real_username(info.user);
            if (info.target === "all") {
                CurrentChat.last_sender = "jtv";
                CurrentChat.insert_with_lock("#chat_line_list", '<li class="line fromjtv"><p class="content">Chat was cleared by a moderator (Prevented by BetterTTV)</p></li>');
            } else if (info.target === "user") {
                if (bttvJquery('#chat_line_list .chat_from_' + info.user.replace(/%/g, '_').replace(/[<>,]/g, '')).length === 0) return; 
                var nickname = CurrentChat.real_username(info.user);
                if (bttvSettings["hideDeletedMessages"] === true) {
                    bttvJquery('#chat_line_list .chat_from_' + info.user.replace(/%/g, '_').replace(/[<>,]/g, '')).each(function () {
                        bttvJquery(this).hide();
                    });
                    setTimeout(function() {
                        bttvJquery('#chat_line_list .bot').each(function () {
                            bttvJquery(this).parent().parent().find("span.chat_line:contains('"+info.user.replace(/%/g, '_').replace(/[<>,]/g, '')+"')").each(function () {
                                bttvJquery(this).parent().parent().hide();
                            });
                            bttvJquery(this).parent().parent().find("p.chat_line:contains('"+info.user.replace(/%/g, '_').replace(/[<>,]/g, '')+"')").each(function () {
                                bttvJquery(this).parent().hide();
                            });
                        });
                    }, 3000);
                } else {
                    if (bttvSettings["showDeletedMessages"] !== true) {
                        bttvJquery('#chat_line_list .chat_from_' + info.user.replace(/%/g, '_').replace(/[<>,]/g, '') + ' .chat_line').each(function () {
                            bttvJquery(this).html("<span style=\"color: #999\">&lt;message deleted&gt;</span>");
                        });
                    } else {
                        bttvJquery('#chat_line_list .chat_from_' + info.user.replace(/%/g, '_').replace(/[<>,]/g, '') + ' .chat_line').each(function () {
                            bttvJquery("a", this).each(function () {
                                var rawLink = "<span style=\"text-decoration: line-through;\">" + bttvJquery(this).attr("href").replace(/</g,"&lt;").replace(/>/g,"&gt;") + "</span>";
                                bttvJquery(this).replaceWith(rawLink);
                            });
                            bttvJquery(".emoticon", this).each(function () {
                                bttvJquery(this).css("opacity","0.1");
                            });
                            bttvJquery(this).html("<span style=\"color: #999\">" + bttvJquery(this).html() + "</span>");
                        });
                    }
                    if(CurrentChat.trackTimeouts[nickname]) {
                        CurrentChat.trackTimeouts[nickname].count++;
                        bttvJquery('#times_from_' + info.user.replace(/%/g, '_').replace(/[<>,]/g, '') + "_" + CurrentChat.trackTimeouts[nickname].timesID).each(function () {
                            bttvJquery(this).html("(" + CurrentChat.trackTimeouts[nickname].count + " times)");
                        });
                    } else {
                        CurrentChat.trackTimeouts[nickname] = {
                            count: 1,
                            timesID: Math.floor(Math.random()*100001)
                        }
                        var displayName = CurrentChat.lookupDisplayName(nickname);
                        CurrentChat.last_sender = "jtv";
                        CurrentChat.insert_with_lock("#chat_line_list", '<li class="line fromjtv"><p class="content">' + displayName + ' has been timed out. <span id="times_from_' + info.user.replace(/%/g, '_').replace(/[<>,]/g, '') + "_" + CurrentChat.trackTimeouts[nickname].timesID + '"></span></p></li>');
                    }
                }
            }
        }

        CurrentChat.Chatters.forceLoadViewers = false;
        CurrentChat.Chatters.oldRender = CurrentChat.Chatters.render;
        CurrentChat.Chatters.render = function(t) {
            var n = this;
            if (t.status !== 200) return;
            n.initialRender && (n.element.find(".js-chat-scroll").TrackpadScrollEmulator({ wrapContent: !1, scrollbarHideStrategy: "rightAndBottom"}), n.initialRender = !1);
            ["staff", "admins", "moderators", "viewers"].forEach(function(e) {
                var r = n.element.find(".js-" + e),
                    i = r.find(".js-viewer-list");
                i.empty();
                var s = "";
                if(e === "viewers" && CurrentChat.Chatters.forceLoadViewers === false && t.data.chatter_count > 5000) {
                    s = '<li class="viewer">>_></li>';
                    s += '<li class="viewer">There\'s '+t.data.chatter_count+' chatters..</li>';
                    s += '<li class="viewer">Why are you even here?</li>';
                    s += '<li class="viewer">&nbsp;</li>';
                    s += '<li class="viewer">You <strong>really</strong> want to lag?</li>';
                    s += '<a href="#" style="cursor:pointer;" onclick="CurrentChat.Chatters.forceLoadViewers=true;return false;">Click here to load viewers</a>';
                } else {
                    t.data.chatters[e].forEach(function(e) {
                        var user = '<li class="viewer"><a href="/' + e + '">' + e + '</a></li>';
                        s += user;
                    });
                }
                i.append(s), i.children().length ? r.show() : r.hide()
            });
            n.element.on("click", ".viewer", function(t) {
                t.preventDefault();
                var n = bttvJquery(this).text(),
                    i = CurrentChat.format_chat_info({ sender: n });
                CurrentChat.setup_chat_popup(i);
                bttvJquery("#chat_viewers_dropmenu").fadeTo(0, .7);
            });
        }

        bttvJquery('#chat_text_input').live('keydown', function (e) {
            var keyCode = e.keyCode || e.which;
            if (keyCode === 9) {
                e.preventDefault();
                var sentence = bttvJquery('#chat_text_input').val().split(' ');
                var partialMatch = sentence.pop().toLowerCase();
                var users = currentViewers;
                var userIndex = 0;
                if (window.partialMatch === undefined) {
                    window.partialMatch = partialMatch;
                } else if (partialMatch.search(window.partialMatch) !== 0) {
                    window.partialMatch = partialMatch;
                } else if (window.lastMatch !== bttvJquery('#chat_text_input').val()) {
                    window.partialMatch = partialMatch;
                } else {
                    if (sentence.length === 0) {
                        userIndex = users.indexOf(partialMatch.substr(0, partialMatch.length - 1));
                    } else {
                        userIndex = users.indexOf(partialMatch);
                    }
                    if (e.shiftKey) {
                        userIndex = userIndex - 1;
                    }
                }
                for (var i = userIndex; i < users.length; i++) {
                    var user = users[i] || '';
                    if (window.partialMatch.length > 0 && user.search(window.partialMatch, "i") === 0) {
                        if (user === partialMatch || user === partialMatch.substr(0, partialMatch.length - 1)) {
                            continue;
                        }
                        if(CurrentChat.displayNames && CurrentChat.displayNames[user]) {
                            sentence.push(CurrentChat.displayNames[user]);
                        } else {
                            sentence.push(user.capitalize());
                        }
                        if (sentence.length === 1) {
                            bttvJquery('#chat_text_input').val(sentence.join(' ') + ":");
                            window.lastMatch = sentence.join(' ') + ":";
                        } else {
                            bttvJquery('#chat_text_input').val(sentence.join(' '));
                            window.lastMatch = sentence.join(' ');
                        }
                        break;
                    }
                }
            }
            if(CurrentChat.sentHistory) {
                chatField = bttvJquery("#chat_text_input")[0].value;
                historyIndex = CurrentChat.sentHistory.indexOf(chatField);
                if (keyCode === 38) {
                    if(historyIndex >= 0) {
                        if(CurrentChat.sentHistory[historyIndex+1]) {
                            bttvJquery("#chat_text_input")[0].value = CurrentChat.sentHistory[historyIndex+1];
                        }
                    } else {
                        if(chatField !== "") {
                            CurrentChat.sentHistory.unshift(chatField);
                            bttvJquery("#chat_text_input")[0].value = CurrentChat.sentHistory[1];
                        } else {
                            bttvJquery("#chat_text_input")[0].value = CurrentChat.sentHistory[0];
                        }
                        
                    }
                }
                if (keyCode === 40) {
                    if(historyIndex >= 0) {
                        if(CurrentChat.sentHistory[historyIndex-1]) {
                            bttvJquery("#chat_text_input")[0].value = CurrentChat.sentHistory[historyIndex-1];
                        } else {
                            bttvJquery("#chat_text_input")[0].value = "";
                        }
                    }
                }
            }
        });

        bttvJquery("#chat_lines").scroll(function () {
            var scrollHeight = bttvJquery("#chat_lines")[0].scrollHeight - bttvJquery("#chat_lines").height(),
                scrollTop = bttvJquery("#chat_lines").scrollTop(),
                distanceFromBottom = scrollHeight - scrollTop;

            if (distanceFromBottom >= 20) {
                CurrentChat.currently_scrolling = 0;
                CurrentChat.line_buffer = 9001;
            } else if (CurrentChat.currently_scrolling !== 1) {
                CurrentChat.currently_scrolling = 1;
                if (bttvSettings["scrollbackAmount"]) {
                    CurrentChat.line_buffer = bttvSettings["scrollbackAmount"];
                } else {
                    CurrentChat.line_buffer = 150;
                }
            }
        });

        setTimeout(function () {
            updateViewerList(false)
        }, 5000);
        setInterval(function () {
            updateViewerList(true)
        }, 300000);
    }

    checkFollowing = function () {

        bttvDebug.log("Check Following List");

        if(bttvJquery("body#chat").length || !Twitch.user.login()) return;

        /*bttvJquery(window).on("firebase:follow_online", function (b, f) {
            console.log(b)
            console.log(f)
            if (f.online === true) {
                Twitch.api.get("channels/" + f.name.toLowerCase()).done(function (d) {
                    if (d.name) {
                        bttvJquery.gritter.add({
                            title: d.display_name + ' is Now Streaming',
                            image: d.logo,
                            text: d.display_name + ' just started streaming ' + d.game + '.<br /><br /><a style="color:white" href="http://www.twitch.tv/' + d.name + '">Click here to head to ' + d.display_name + '\'s channel</a>.',
                        });
                    }
                });
            }
        });*/

        Twitch.api.get("streams/followed?limit=250").done(function (d) {
            if (d.streams && d.streams.length > 0) {
                ga('send', 'event', 'Channels', 'Check Following');
                if (liveChannels.length === 0) {
                    liveChannels.push("loaded");
                    d.streams.forEach(function(stream) {
                        var channel = stream.channel;
                        if (liveChannels.indexOf(channel.name) === -1) {
                            liveChannels.push(channel.name);
                        }
                    });
                } else {
                    var channels = [];
                    d.streams.forEach(function(stream) {
                        var channel = stream.channel;
                        channels.push(channel.name);
                        if (liveChannels.indexOf(channel.name) === -1) {
                            bttvDebug.log(channel.name+" is now streaming");
                            if (channel.game == null) channel.game = "on Twitch";
                            bttvJquery.gritter.add({
                                title: channel.display_name + ' is Now Streaming',
                                image: channel.logo,
                                text: channel.display_name + ' just started streaming ' + channel.game + '.<br /><br /><a style="color:white" href="http://www.twitch.tv/' + channel.name + '">Click here to head to ' + channel.display_name + '\'s channel</a>.',
                            });
                        }
                    });
                    liveChannels = channels;
                }
                
                bttvJquery("a[href=\"/directory/following\"] .js-total").html(d.streams.length);
                bttvJquery("a[href=\"/directory/following\"] .js-total").css("display","inline");
            }
            setTimeout(checkFollowing, 60000)
        });

    }

    overrideEmotes = function () {

        if (!document.getElementById("chat_lines")) return;

        if(typeof CurrentChat == "undefined" || !CurrentChat.channel) return;

        bttvDebug.log("Overriding Twitch Emoticons");

        var betterttvEmotes = [];

        var oldEmotes = [
            "http://static-cdn.jtvnw.net/jtv_user_pictures/chansub-global-emoticon-ebf60cd72f7aa600-24x18.png",
            "http://static-cdn.jtvnw.net/jtv_user_pictures/chansub-global-emoticon-d570c4b3b8d8fc4d-24x18.png",
            "http://static-cdn.jtvnw.net/jtv_user_pictures/chansub-global-emoticon-ae4e17f5b9624e2f-24x18.png",
            "http://static-cdn.jtvnw.net/jtv_user_pictures/chansub-global-emoticon-b9cbb6884788aa62-24x18.png",
            "http://static-cdn.jtvnw.net/jtv_user_pictures/chansub-global-emoticon-2cde79cfe74c6169-24x18.png",
            "http://static-cdn.jtvnw.net/jtv_user_pictures/chansub-global-emoticon-577ade91d46d7edc-24x18.png",
            "http://static-cdn.jtvnw.net/jtv_user_pictures/chansub-global-emoticon-374120835234cb29-24x18.png",
            "http://static-cdn.jtvnw.net/jtv_user_pictures/chansub-global-emoticon-cfaf6eac72fe4de6-24x18.png",
            "http://static-cdn.jtvnw.net/jtv_user_pictures/chansub-global-emoticon-e838e5e34d9f240c-24x18.png",
            "http://static-cdn.jtvnw.net/jtv_user_pictures/chansub-global-emoticon-3407bf911ad2fd4a-24x18.png",
            "http://static-cdn.jtvnw.net/jtv_user_pictures/chansub-global-emoticon-0536d670860bf733-24x18.png",
            "http://static-cdn.jtvnw.net/jtv_user_pictures/chansub-global-emoticon-8e128fa8dc1de29c-24x18.png",
            "http://static-cdn.jtvnw.net/jtv_user_pictures/chansub-global-emoticon-d31223e81104544a-24x18.png",
            "http://static-cdn.jtvnw.net/jtv_user_pictures/chansub-global-emoticon-9f2ac5d4b53913d7-24x18.png"
        ];
        var newEmotes = [
            "http://cdn.betterttv.net/emotes/jtv/happy.gif",
            "http://cdn.betterttv.net/emotes/jtv/sad.gif",
            "http://cdn.betterttv.net/emotes/jtv/surprised.gif",
            "http://cdn.betterttv.net/emotes/jtv/bored.gif",
            "http://cdn.betterttv.net/emotes/jtv/cool.gif",
            "http://cdn.betterttv.net/emotes/jtv/horny.gif",
            "http://cdn.betterttv.net/emotes/jtv/skeptical.gif",
            "http://cdn.betterttv.net/emotes/jtv/wink.gif",
            "http://cdn.betterttv.net/emotes/jtv/raspberry.gif",
            "http://cdn.betterttv.net/emotes/jtv/winkberry.gif",
            "http://cdn.betterttv.net/emotes/jtv/pirate.gif",
            "http://cdn.betterttv.net/emotes/jtv/drunk.gif",
            "http://cdn.betterttv.net/emotes/jtv/angry.gif",
            "http://cdn.betterttv.net/emotes/mw.png"
        ];

        CurrentChat.emoticons = [];
        CurrentChat.autoCompleteEmotes = {};

        Twitch.api.get("chat/emoticons").done(function (a) {
            var d = 0;
            cssString = "";
            if(Twitch.user.login() && CurrentChat.user_to_emote_sets[Twitch.user.login()]) {
                var autoComplete = true;
                var user = Twitch.user.login();
            } else {
                var autoComplete = false;
            }
            a.emoticons.forEach(function (a) {
                a.regex.match(/^\w+$/) ? a.regex = new RegExp("\\b" + a.regex + "\\b", "g") : a.regex = new RegExp(a.regex, "g");
                a.images.forEach(function (b) {
                    d += 1;
                    if (oldEmotes.indexOf(b.url) !== -1 && bttvSettings["showDefaultEmotes"] !== true) {
                        b.url = newEmotes[oldEmotes.indexOf(b.url)];
                        b.height = 22;
                        b.width = 22;
                    }
                    if(autoComplete === true && CurrentChat.user_to_emote_sets[user].indexOf(b.emoticon_set) !== -1) {
                        var prefixRegex = /^\/\\b([a-z]+)([0-9A-Z][0-9A-Za-z]+)\\b\/g$/,
                            rawCommand = prefixRegex.exec(a.regex);
                        if(rawCommand) {
                            if(/^[a-zA-Z0-9]{5,}$/.test(rawCommand[2])) {
                                CurrentChat.autoCompleteEmotes[rawCommand[2]] = rawCommand[1]+rawCommand[2];
                            }
                        }
                    }
                    b.html = ich["chat-emoticon"]({
                        id: d
                    }).prop("outerHTML");
                    cssString += CurrentChat.generate_emoticon_css(b, d);
                });
                CurrentChat.emoticons.push(a);
            });
            if (bttvSettings["bttvEmotes"] !== false) {
                betterttvEmotes.forEach(function (b) {
                    var a = {};
                    a.text = b.regex.replace(/\\/g,"").replace(/\((.*)\|(.*)\)/,"$1");
                    b.regex.match(/^\w+$/) ? a.regex = new RegExp("\\b" + b.regex + "\\b", "g") : a.regex = new RegExp(b.regex, "g");
                    a.images = [];
                    a.images.push({
                        emoticon_set: null,
                        width: b.width,
                        height: b.height,
                        url: b.url
                    });
                    a.images.forEach(function (a) {
                        d += 1;
                        a.html = ich["chat-emoticon"]({
                            id: d
                        }).prop("outerHTML");
                        cssString += CurrentChat.generate_emoticon_css(a, d);
                    });
                    CurrentChat.emoticons.push(a);
                    a.regex = a.text;
                });
            }
            cssString += ".emoticon { display: inline-block; }";
            var emoteCSS = document.createElement("style");
            emoteCSS.setAttribute("type", "text/css");
            emoteCSS.innerHTML = cssString;
            bttvJquery('body').append(emoteCSS);
        });

    }

    updateViewerList = function (modsList) {

        bttvDebug.log("Updating Viewer List");

        if(typeof CurrentChat == "undefined" || !CurrentChat.channel) return;

        grabChatters = function() {
            if(CurrentChat.Chatters.bttvUpdating !== true) return;
            bttvJquery.ajax({
                url: "https://tmi.twitch.tv/group/user/" + CurrentChat.channel + "/chatters?update_num=" + CurrentChat.Chatters.bttvUpdateNum + "&callback=?",
                cache: !1,
                dataType: "jsonp",
                timeoutLength: 6E3
            }).done(function (d) {
                CurrentChat.Chatters.bttvUpdating = false;
                ga('send', 'event', 'Chat', 'Update Chatters');
                if (d.data.chatters) {
                    currentViewers = [];
                    ["staff", "admins", "moderators", "viewers"].forEach(function (a) {
                        d.data.chatters[a].forEach(function (a) {
                            currentViewers.push(a);
                        });
                        if(a === "staff" || a === "admins") {
                            d.data.chatters[a].forEach(function (a) {
                                d.data.chatters["moderators"].push(a);
                            });
                        }
                        if(a === "staff") {
                            d.data.chatters[a].forEach(function (a) {
                                if(!CurrentChat.staff[a]) {
                                    var action = {
                                        kind: "staff",
                                        user: a
                                    }
                                    fakeCurrentChat("special_user", action);
                                    bttvDebug.log("Added "+a+" as staff");
                                }
                            });
                        }
                        if(a === "admins") {
                            d.data.chatters[a].forEach(function (a) {
                                if(!CurrentChat.admins[a]) {
                                    var action = {
                                        kind: "admin",
                                        user: a
                                    }
                                    fakeCurrentChat("special_user", action);
                                    bttvDebug.log("Added "+a+" as admin");
                                }
                            });
                        }
                        /*if(a === "moderators") {
                            d.data.chatters[a].forEach(function (a) {
                                if(!CurrentChat.moderators[a]) {
                                    var action = {
                                        sender: "jtv",
                                        target: a
                                    }
                                    fakeCurrentChat("user_oped", action);
                                    bttvDebug.log("Added "+a+" as a mod");
                                }
                            });
                            for (mod in CurrentChat.moderators) {
                                if(CurrentChat.moderators.hasOwnProperty(mod)) {
                                    if(d.data.chatters[a].indexOf(mod) === -1) {
                                       var action = {
                                            sender: "jtv",
                                            target: mod
                                        }
                                        fakeCurrentChat("user_deoped", action);
                                        bttvDebug.log("Removed "+mod+" as a mod"); 
                                    }
                                }
                            }
                        }*/
                    });
                }
            }).always(function () {
                if(CurrentChat.Chatters.bttvUpdateNum < CurrentChat.Chatters.MAX_INTERVAL) {
                    CurrentChat.Chatters.bttvUpdateNum++;
                    var waitTime = Math.floor(CurrentChat.Chatters.UPDATE_TIMEOUT * Math.pow(1 + CurrentChat.Chatters.GROWTH_RATE, CurrentChat.Chatters.bttvUpdateNum));
                    if(CurrentChat.Chatters.bttvTimeout) clearTimeout(CurrentChat.Chatters.bttvTimeout);
                    CurrentChat.Chatters.bttvTimeout = setTimeout(grabChatters, waitTime);
                }
            });
        }

        CurrentChat.Chatters.bttvUpdating = true;
        CurrentChat.Chatters.bttvUpdateNum = 0;
        grabChatters();
        if(modsList && CurrentChat.TMIFailedToJoin === false && CurrentChat.checkModsViaCommand === true) {
            if(Twitch.user.login()) {
                CurrentChat.checkingMods = true;
                CurrentChat.checkMods = true;
                CurrentChat.say("/mods");
            }
        }
    }

    fakeCurrentChat = function (func, action) {
        var n = CurrentChat.handlers[func];
        n && n.call(CurrentChat, action);
    }

    handleBackground = function () {
        var g = bttvJquery("#custom_bg"),
            d = g[0];
        if (d && d.getContext) {
            var c = d.getContext("2d"),
                h = bttvJquery("#custom_bg").attr("image");
            if (!h) {
                bttvJquery(d).css("background-image", "");
                c.clearRect(0, 0, d.width, d.height);
            } else if (g.css({
                width: "100%",
                "background-position": "center top"
            }), g.hasClass("tiled")) {
                g.css({
                    "background-image": 'url("' + h + '")'
                }).attr("width", 200).attr("height", 200);
                d = c.createLinearGradient(0, 0, 0, 200);
                if (bttvSettings["darkenedMode"] === true) {
                    d.addColorStop(0, "rgba(20,20,20,0.4)");
                    d.addColorStop(1, "rgba(20,20,20,1)");
                } else {
                    d.addColorStop(0, "rgba(245,245,245,0.65)");
                    d.addColorStop(1, "rgba(245,245,245,1)");
                }
                c.fillStyle = d;
                c.fillRect(0, 0, 200, 200);
            } else {
                var i = document.createElement("IMG");
                i.onload = function () {
                    var a = this.width,
                        d = this.height,
                        h;
                    g.attr("width", a).attr("height", d);
                    c.drawImage(i, 0, 0);
                    if (bttvSettings["darkenedMode"] === true) {
                        d > a ? (h = c.createLinearGradient(0, 0, 0, a), h.addColorStop(0, "rgba(20,20,20,0.4)"), h.addColorStop(1, "rgba(20,20,20,1)"), c.fillStyle = h, c.fillRect(0, 0, a, a), c.fillStyle = "rgb(20,20,20)", c.fillRect(0, a, a, d - a)) : (h = c.createLinearGradient(0, 0, 0, d), h.addColorStop(0, "rgba(20,20,20,0.4)"), h.addColorStop(1, "rgba(20,20,20,1)"), c.fillStyle = h, c.fillRect(0, 0, a, d))
                    } else {
                        d > a ? (h = c.createLinearGradient(0, 0, 0, a), h.addColorStop(0, "rgba(245,245,245,0.65)"), h.addColorStop(1, "rgba(245,245,245,1)"), c.fillStyle = h, c.fillRect(0, 0, a, a), c.fillStyle = "rgb(245,245,245)", c.fillRect(0, a, a, d - a)) : (h = c.createLinearGradient(0, 0, 0, d), h.addColorStop(0, "rgba(245,245,245,0.65)"), h.addColorStop(1, "rgba(245,245,245,1)"), c.fillStyle = h, c.fillRect(0, 0, a, d))
                    }
                };
                i.src = h;
            }
        }
    };

    darkenPage = function () {

        if (bttvJquery("body[data-page=\"ember#ember\"]").length || bttvJquery("body[data-page=\"chapter#show\"]").length || bttvJquery("body[data-page=\"archive#show\"]").length || (bttvJquery("#twitch_chat").length)) {

            if (bttvSettings["darkenedMode"] === true) {

                bttvDebug.log("Darkening Page");

                var darkCSS = document.createElement("link");
                darkCSS.setAttribute("href", "http://cdn.betterttv.net/betterttv-dark.css");
                darkCSS.setAttribute("type", "text/css");
                darkCSS.setAttribute("rel", "stylesheet");
                darkCSS.setAttribute("id", "darkTwitch");
                bttvJquery('body').append(darkCSS);

                bttvJquery("#main_col .content #stats_and_actions #channel_stats #channel_viewer_count").css("display", "none");
                setTimeout(handleBackground, 1000);
            }

        }

    }

    splitChat = function () {

        if (bttvJquery("#twitch_chat").length && bttvSettings["splitChat"] !== false) {

            bttvDebug.log("Splitting Chat");

            var splitCSS = document.createElement("link");
            bttvSettings["darkenedMode"] === true ? splitCSS.setAttribute("href", "http://cdn.betterttv.net/betterttv-splitchat-dark.css") : splitCSS.setAttribute("href", "http://cdn.betterttv.net/betterttv-splitchat.css");
            splitCSS.setAttribute("type", "text/css");
            splitCSS.setAttribute("rel", "stylesheet");
            splitCSS.setAttribute("id", "splitChat");
            bttvJquery('body').append(splitCSS);
        }

    }

    flipDashboard = function () {

        if (bttvJquery("#dash_main").length && bttvSettings["flipDashboard"] === true) {

            bttvDebug.log("Flipping Dashboard");

            // We want to move the chat to the left, and the dashboard controls to the right.
            bttvJquery("#controls_column, #player_column").css({
                float: "right",
                marginLeft: "500px"
            });
            bttvJquery("#chat").css({
                float: "left",
                left: "20px",
                right: ""
            });

        }

    }

    formatDashboard = function () {

        if (bttvJquery("#dash_main").length) {

            bttvDebug.log("Formatting Dashboard");

            if(typeof CurrentChat == "undefined") return;

            // Move Page Elements to Sub-DIV & Account for Changes
            if(CurrentChat.flash_loaded) CurrentChat.disconnect();
            removeElement(".line");
            bttvJquery('<div style="position:relative;" id="bttvDashboard"></div>').appendTo('#dash_main');
            bttvJquery("#dash_main #controls_column").appendTo("#bttvDashboard");
            bttvJquery("#dash_main #player_column").appendTo("#bttvDashboard");
            bttvJquery("#dash_main #chat").appendTo("#bttvDashboard");
            setTimeout(function(){ CurrentChat.clearHandlers(); }, 2000);
            setTimeout(function(){ CurrentChat.setupHandlers(); }, 4000);

            // Small Dashboard Fixes
            bttvJquery("#commercial_options .dropmenu_action[data-length=150]").html("2m 30s");
            bttvJquery("#controls_column #form_submit button").attr("class", "primary_button");

        }

    }

    dashboardViewers = function () {

        if (bttvJquery("#dash_main").length) {

            bttvDebug.log("Updating Dashboard Viewers");

            if(typeof CurrentChat == "undefined" || !CurrentChat.channel) return;

            // If the Dashboard stream is hidden, we need to update the viewer count.
            Twitch.api.get("streams/" + CurrentChat.channel).done(function (a) {
                if (a.stream && a.stream.viewers) {
                    bttvJquery("#channel_viewer_count").html(a.stream.viewers);
                } else {
                    bttvJquery("#channel_viewer_count").html("Offline");
                }
                setTimeout(dashboardViewers, 60000);
            });
        }

    }

    giveawayCompatibility = function () {

        if (bttvJquery("#dash_main").length) {

            bttvDebug.log("Giveaway Plugin Dashboard Compatibility");

            bttvJquery(".tga_modal").appendTo("#bttvDashboard");
            bttvJquery(".tga_button").click(function () {
                if (bttvSettings["flipDashboard"] === true) {
                    bttvJquery("#chat").width("330px");
                    bttvJquery(".tga_modal").css("right", "20px");
                } else {
                    bttvJquery("#chat").width("330px");
                    bttvJquery(".tga_modal").css("right", "inherit");
                }
            });
            bttvJquery("button[data-action=\"close\"]").click(function () {
                bttvJquery("#chat").width("500px");
            });
        }

    }

    handleTwitchChatEmotesScript = function () {

        if (bttvJquery("#twitch_chat").length && bttvSettings["clickTwitchEmotes"] === true) {

            bttvDebug.log("Injecting Twitch Chat Emotes Script");

            emotesJSInject = document.createElement("script");
            emotesJSInject.setAttribute("src", "http://cdn.betterttv.net/twitchemotes.js");
            emotesJSInject.setAttribute("type", "text/javascript");
            emotesJSInject.setAttribute("id", "clickTwitchEmotes");
            bttvJquery("body").append(emotesJSInject);
        }

    }

    createSettingsMenu = function () {

        var settingsMenu = document.getElementById("chat_settings_dropmenu");
        if (!settingsMenu) return;

        bttvDebug.log("Creating BetterTTV Settings Menu");

        bttvChatSettings = document.createElement("div");
        bttvChatSettings.setAttribute("align", "left");
        bttvChatSettings.setAttribute("id", "bttvsettings");
        bttvChatSettings.style.margin = "0px auto";

        bttvChatSettings.innerHTML = '<ul class="dropmenu_col inline_all"> \
                            <li id="chat_section_chatroom" class="dropmenu_section"> \
                            <br /> \
                            &nbsp;&nbsp;&nbsp;&raquo;&nbsp;BetterTTV \
                            <br /> \
                            ' + (bttvJquery("body#chat").length ? '<a class="dropmenu_action g18_gear-FFFFFF80" href="#" id="blackChatLink" onclick="betterttvAction(\'toggleBlackChat\'); return false;">Black Chat (Chroma Key)</a>' : '') + ' \
                            ' + (bttvJquery("#dash_main").length ? '<a class="dropmenu_action g18_gear-FFFFFF80" href="#" id="flipDashboard" onclick="betterttvAction(\'flipDashboard\'); return false;">' + (bttvSettings["flipDashboard"] === true ? 'Unflip Dashboard' : 'Flip Dashboard') + '</a>' : '') + ' \
                            <a class="dropmenu_action g18_gear-FFFFFF80" href="#" onclick="betterttvAction(\'setBlacklistKeywords\'); return false;">Set Blacklist Keywords</a> \
                            <a class="dropmenu_action g18_gear-FFFFFF80" href="#" onclick="betterttvAction(\'setHighlightKeywords\'); return false;">Set Highlight Keywords</a> \
                            <a class="dropmenu_action g18_gear-FFFFFF80" href="#" onclick="betterttvAction(\'setScrollbackAmount\'); return false;">Set Scrollback Amount</a> \
                            <a class="dropmenu_action g18_trash-FFFFFF80" href="#" onclick="betterttvAction(\'clearChat\'); return false;">Clear My Chat</a> \
                            <br /> \
                            ' + (!bttvJquery("body#chat").length ? '<a class="dropmenu_action g18_gear-FFFFFF80" href="#" onclick="betterttvAction(\'openSettings\'); return false;">BetterTTV Settings</a>' : '') + ' \
                            </li> \
                            </ul> \
                            ';

        settingsMenu.appendChild(bttvChatSettings);

        settingsPanel = document.createElement("div");
        settingsPanel.setAttribute("id", "bttvSettingsPanel");
        settingsPanel.style.display = "none";
        settingsPanel.innerHTML = '<div id="header"> \
                                    <span id="logo"><img height="45px" src="http://cdn.betterttv.net/bttvlogo.png" /></span> \
                                    <ul class="nav"> \
                                        <li><a href="#bttvAbout">About</a></li> \
                                        <li class="active"><a href="#bttvSettings">Settings</a></li> \
                                        <li><a href="#bttvChangelog">Changelog</a></li> \
                                        <li><a href="#bttvPrivacy">Privacy Policy</a></li> \
                                    </ul><span id="close">&times;</span> \
                                   </div> \
                                   <div id="bttvSettings" style="overflow-y:auto;height:425px;"> \
                                    <h2 class="option"> Here you can manage the various BetterTTV options. Click On or Off to toggle settings.</h2> \
                                    <div class="option bttvHiddenSetting" style="display:none;"> \
                                        <span style="font-weight:bold;font-size:14px;color:#D3D3D3;">Admin/Staff Alert</span>&nbsp;&nbsp;&mdash;&nbsp;&nbsp;Get alerted in chat when admins or staff join \
                                        <div class="switch"> \
                                            <input type="radio" class="switch-input switch-off" name="toggleAdminStaffAlert" value="false" id="adminStaffAlertFalse"> \
                                            <label for="adminStaffAlertFalse" class="switch-label switch-label-off">Off</label> \
                                            <input type="radio" class="switch-input" name="toggleAdminStaffAlert" value="true" id="adminStaffAlertTrue" checked> \
                                            <label for="adminStaffAlertTrue" class="switch-label switch-label-on">On</label> \
                                            <span class="switch-selection"></span> \
                                        </div> \
                                    </div> \
                                    <div class="option"> \
                                        <span style="font-weight:bold;font-size:14px;color:#D3D3D3;">Anti-Prefix Completion</span>&nbsp;&nbsp;&mdash;&nbsp;&nbsp;Allows you to use sub emotes (greater than 4 characters) without prefixes (BETA) \
                                        <div class="switch"> \
                                            <input type="radio" class="switch-input switch-off" name="toggleAntiPrefix" value="false" id="antiPrefixFalse"> \
                                            <label for="antiPrefixFalse" class="switch-label switch-label-off">Off</label> \
                                            <input type="radio" class="switch-input" name="toggleAntiPrefix" value="true" id="antiPrefixTrue" checked> \
                                            <label for="antiPrefixTrue" class="switch-label switch-label-on">On</label> \
                                            <span class="switch-selection"></span> \
                                        </div> \
                                    </div> \
                                    <div class="option"> \
                                        <span style="font-weight:bold;font-size:14px;color:#D3D3D3;">BetterTTV Chat</span>&nbsp;&nbsp;&mdash;&nbsp;&nbsp;A tiny chat bar for personal messaging friends (BETA) \
                                        <div class="switch"> \
                                            <input type="radio" class="switch-input switch-off" name="toggleBTTVChat" value="false" id="showBTTVChatFalse"> \
                                            <label for="showBTTVChatFalse" class="switch-label switch-label-off">Off</label> \
                                            <input type="radio" class="switch-input" name="toggleBTTVChat" value="true" id="showBTTVChatTrue" checked> \
                                            <label for="showBTTVChatTrue" class="switch-label switch-label-on">On</label> \
                                            <span class="switch-selection"></span> \
                                        </div> \
                                    </div> \
                                    <div class="option"> \
                                        <span style="font-weight:bold;font-size:14px;color:#D3D3D3;">BetterTTV Emotes</span>&nbsp;&nbsp;&mdash;&nbsp;&nbsp;Some people don\'t like the extra emoticons :\'( \
                                        <div class="switch"> \
                                            <input type="radio" class="switch-input switch-off" name="toggleBTTVEmotes" value="false" id="showBTTVEmotesFalse"> \
                                            <label for="showBTTVEmotesFalse" class="switch-label switch-label-off">Off</label> \
                                            <input type="radio" class="switch-input" name="toggleBTTVEmotes" value="true" id="showBTTVEmotesTrue" checked> \
                                            <label for="showBTTVEmotesTrue" class="switch-label switch-label-on">On</label> \
                                            <span class="switch-selection"></span> \
                                        </div> \
                                    </div> \
                                    <div class="option"> \
                                        <span style="font-weight:bold;font-size:14px;color:#D3D3D3;">DarkenTTV</span>&nbsp;&nbsp;&mdash;&nbsp;&nbsp;A slick, grey theme which will make you love the site even more \
                                        <div class="switch"> \
                                            <input type="radio" class="switch-input switch-off" name="toggleDarkTwitch" value="false" id="darkenedModeFalse"> \
                                            <label for="darkenedModeFalse" class="switch-label switch-label-off">Off</label> \
                                            <input type="radio" class="switch-input" name="toggleDarkTwitch" value="true" id="darkenedModeTrue" checked> \
                                            <label for="darkenedModeTrue" class="switch-label switch-label-on">On</label> \
                                            <span class="switch-selection"></span> \
                                        </div> \
                                    </div> \
                                    <div class="option"> \
                                        <span style="font-weight:bold;font-size:14px;color:#D3D3D3;">Default Emoticons</span>&nbsp;&nbsp;&mdash;&nbsp;&nbsp;BetterTTV replaces the robot emoticons with the old JTV monkey faces by default \
                                        <div class="switch"> \
                                            <input type="radio" class="switch-input switch-off" name="toggleDefaultEmotes" value="false" id="defaultEmotesFalse"> \
                                            <label for="defaultEmotesFalse" class="switch-label switch-label-off">Off</label> \
                                            <input type="radio" class="switch-input" name="toggleDefaultEmotes" value="true" id="defaultEmotesTrue" checked> \
                                            <label for="defaultEmotesTrue" class="switch-label switch-label-on">On</label> \
                                            <span class="switch-selection"></span> \
                                        </div> \
                                    </div> \
                                    <div class="option"> \
                                        <span style="font-weight:bold;font-size:14px;color:#D3D3D3;">Default Purple Buttons</span>&nbsp;&nbsp;&mdash;&nbsp;&nbsp;BetterTTV replaces the primary buttons with blue ones by default \
                                        <div class="switch"> \
                                            <input type="radio" class="switch-input switch-off" name="togglePurpleButtons" value="false" id="defaultPurpleButtonsFalse"> \
                                            <label for="defaultPurpleButtonsFalse" class="switch-label switch-label-off">Off</label> \
                                            <input type="radio" class="switch-input" name="togglePurpleButtons" value="true" id="defaultPurpleButtonsTrue" checked> \
                                            <label for="defaultPurpleButtonsTrue" class="switch-label switch-label-on">On</label> \
                                            <span class="switch-selection"></span> \
                                        </div> \
                                    </div> \
                                    <div class="option"> \
                                        <span style="font-weight:bold;font-size:14px;color:#D3D3D3;">Default to Live Channels</span>&nbsp;&nbsp;&mdash;&nbsp;&nbsp;BetterTTV can click on "Live Channels" for you in the Directory when enabled \
                                        <div class="switch"> \
                                            <input type="radio" class="switch-input switch-off" name="toggleDirectoryLiveTab" value="false" id="directoryLiveTabFalse" checked> \
                                            <label for="directoryLiveTabFalse" class="switch-label switch-label-off">Off</label> \
                                            <input type="radio" class="switch-input" name="toggleDirectoryLiveTab" value="true" id="directoryLiveTabTrue"> \
                                            <label for="directoryLiveTabTrue" class="switch-label switch-label-on">On</label> \
                                            <span class="switch-selection"></span> \
                                        </div> \
                                    </div> \
                                    <div class="option"> \
                                        <span style="font-weight:bold;font-size:14px;color:#D3D3D3;">Featured Channels</span>&nbsp;&nbsp;&mdash;&nbsp;&nbsp;The left sidebar is too cluttered, so BetterTTV removes featured channels by default \
                                        <div class="switch"> \
                                            <input type="radio" class="switch-input switch-off" name="toggleFeaturedChannels" value="false" id="featuredChannelsFalse"> \
                                            <label for="featuredChannelsFalse" class="switch-label switch-label-off">Off</label> \
                                            <input type="radio" class="switch-input" name="toggleFeaturedChannels" value="true" id="featuredChannelsTrue" checked> \
                                            <label for="featuredChannelsTrue" class="switch-label switch-label-on">On</label> \
                                            <span class="switch-selection"></span> \
                                        </div> \
                                    </div> \
                                    <div class="option"> \
                                        <span style="font-weight:bold;font-size:14px;color:#D3D3D3;">HLS Transcoding</span>&nbsp;&nbsp;&mdash;&nbsp;&nbsp;Enables switching resolutions for non-partners (if they appear on mobile devices) (BETA) \
                                        <div class="switch"> \
                                            <input type="radio" class="switch-input switch-off" name="toggleBTTVHLS" value="false" id="showBTTVHLSFalse"> \
                                            <label for="showBTTVHLSFalse" class="switch-label switch-label-off">Off</label> \
                                            <input type="radio" class="switch-input" name="toggleBTTVHLS" value="true" id="showBTTVHLSTrue" checked> \
                                            <label for="showBTTVHLSTrue" class="switch-label switch-label-on">On</label> \
                                            <span class="switch-selection"></span> \
                                        </div> \
                                    </div> \
                                    <div class="option"> \
                                        <span style="font-weight:bold;font-size:14px;color:#D3D3D3;">JTV Chat Tags</span>&nbsp;&nbsp;&mdash;&nbsp;&nbsp;BetterTTV can replace the chat tags with the ones from JTV \
                                        <div class="switch"> \
                                            <input type="radio" class="switch-input switch-off" name="toggleDefaultTags" value="false" id="defaultTagsFalse"> \
                                            <label for="defaultTagsFalse" class="switch-label switch-label-off">Off</label> \
                                            <input type="radio" class="switch-input" name="toggleDefaultTags" value="true" id="defaultTagsTrue" checked> \
                                            <label for="defaultTagsTrue" class="switch-label switch-label-on">On</label> \
                                            <span class="switch-selection"></span> \
                                        </div> \
                                    </div> \
                                    <div class="option"> \
                                        <span style="font-weight:bold;font-size:14px;color:#D3D3D3;">Remove Deleted Messages</span>&nbsp;&nbsp;&mdash;&nbsp;&nbsp;Make those spammers disappear completely! \
                                        <div class="switch"> \
                                            <input type="radio" class="switch-input switch-off" name="toggleHideDeletedMessages" value="false" id="hideDeletedMessagesFalse"> \
                                            <label for="hideDeletedMessagesFalse" class="switch-label switch-label-off">Off</label> \
                                            <input type="radio" class="switch-input" name="toggleHideDeletedMessages" value="true" id="hideDeletedMessagesTrue" checked> \
                                            <label for="hideDeletedMessagesTrue" class="switch-label switch-label-on">On</label> \
                                            <span class="switch-selection"></span> \
                                        </div> \
                                    </div> \
                                    <div class="option"> \
                                        <span style="font-weight:bold;font-size:14px;color:#D3D3D3;">Show Deleted Messages</span>&nbsp;&nbsp;&mdash;&nbsp;&nbsp;Turn this on to change &lt;message deleted&gt; back to users\' messages. \
                                        <div class="switch"> \
                                            <input type="radio" class="switch-input switch-off" name="toggleDeletedMessages" value="false" id="showDeletedMessagesFalse"> \
                                            <label for="showDeletedMessagesFalse" class="switch-label switch-label-off">Off</label> \
                                            <input type="radio" class="switch-input" name="toggleDeletedMessages" value="true" id="showDeletedMessagesTrue" checked> \
                                            <label for="showDeletedMessagesTrue" class="switch-label switch-label-on">On</label> \
                                            <span class="switch-selection"></span> \
                                        </div> \
                                    </div> \
                                    <div class="option"> \
                                        <span style="font-weight:bold;font-size:14px;color:#D3D3D3;">Split Chat</span>&nbsp;&nbsp;&mdash;&nbsp;&nbsp;Easily distinguish between messages from different users in chat \
                                        <div class="switch"> \
                                            <input type="radio" class="switch-input switch-off" name="toggleSplitChat" value="false" id="splitChatFalse"> \
                                            <label for="splitChatFalse" class="switch-label switch-label-off">Off</label> \
                                            <input type="radio" class="switch-input" name="toggleSplitChat" value="true" id="splitChatTrue" checked> \
                                            <label for="splitChatTrue" class="switch-label switch-label-on">On</label> \
                                            <span class="switch-selection"></span> \
                                        </div> \
                                    </div> \
                                    <div class="option"> \
                                        <span style="font-weight:bold;font-size:14px;color:#D3D3D3;">Self Highlights</span>&nbsp;&nbsp;&mdash;&nbsp;&nbsp;Toggle this off to disable highlights on your own username \
                                        <div class="switch"> \
                                            <input type="radio" class="switch-input switch-off" name="toggleSelfHighlights" value="false" id="selfHighlightsFalse"> \
                                            <label for="selfHighlightsFalse" class="switch-label switch-label-off">Off</label> \
                                            <input type="radio" class="switch-input" name="toggleSelfHighlights" value="true" id="selfHighlightsTrue" checked> \
                                            <label for="selfHighlightsTrue" class="switch-label switch-label-on">On</label> \
                                            <span class="switch-selection"></span> \
                                        </div> \
                                    </div> \
                                    <div class="option"> \
                                        <span style="font-weight:bold;font-size:14px;color:#D3D3D3;">Twitch Chat Emotes</span>&nbsp;&nbsp;&mdash;&nbsp;&nbsp;Why remember emotes when you can "click-to-insert" them (by Ryan Chatham) \
                                        <div class="switch"> \
                                            <input type="radio" class="switch-input switch-off" name="toggleClickTwitchEmotes" value="false" id="clickTwitchEmotesFalse"> \
                                            <label for="clickTwitchEmotesFalse" class="switch-label switch-label-off">Off</label> \
                                            <input type="radio" class="switch-input" name="toggleClickTwitchEmotes" value="true" id="clickTwitchEmotesTrue" checked> \
                                            <label for="clickTwitchEmotesTrue" class="switch-label switch-label-on">On</label> \
                                            <span class="switch-selection"></span> \
                                        </div> \
                                    </div> \
                                    <div class="option"> \
                                        Think something is missing here? Send in a <a href="http://bugs.nightdev.com/projects/betterttv/issues/new?tracker_id=2" target="_blank">feature request</a>! \
                                    </div> \
                                   </div> \
                                   <div id="bttvAbout" style="display:none;"> \
                                    <div class="aboutHalf"> \
                                        <img class="bttvAboutIcon" src="http://cdn.betterttv.net/icon.png" /> \
                                        <h1>BetterTTV v'+ bttvVersion + 'R' + bttvRelease + '</h1> \
                                        <h2>from your friends at <a href="http://www.nightdev.com" target="_blank">NightDev</a></h2> \
                                        <br /> \
                                    </div> \
                                    <div class="aboutHalf"> \
                                        <h1 style="margin-top: 100px;">Think this addon is awesome?</h1><br /><br /> \
                                        <h2><a href="https://chrome.google.com/webstore/detail/ajopnjidmegmdimjlfnijceegpefgped">Drop a Review on the Chrome Webstore</a></h2> \
                                        <br /> \
                                        <h2>or maybe</h2> \
                                        <br /> \
                                        <h2><a href="http://streamdonations.net/c/night">Support the Developer</a></h2> \
                                        <br /> \
                                    </div> \
                                   </div> \
                                   <div id="bttvPrivacy" style="display:none;"> \
                                    <iframe src="http://cdn.betterttv.net/privacy.html" width="100%" height="425" style="border:none;background-color:transparent;"></iframe> \
                                   </div> \
                                   <div id="bttvChangelog" style="display:none;"> \
                                    <iframe src="http://cdn.betterttv.net/changelog.html?'+ bttvVersion + 'R' + bttvRelease + '" width="100%" height="425" style="border:none;background-color:transparent;"></iframe> \
                                   </div> \
                                   <div id="footer"> \
                                    <span>BetterTTV &copy; <a href="http://www.nightdev.com" target="_blank">NightDev</a> 2013</span><span style="float:right;"><a href="http://www.nightdev.com/contact" target="_blank">Get Support</a> | <a href="http://bugs.nightdev.com/projects/betterttv/issues/new?tracker_id=1" target="_blank">Report a Bug</a> | <a href="http://streamdonations.net/c/night" target="_blank">Support the Developer</a></span> \
                                   </div>';
        bttvJquery("body").append(settingsPanel);

        bttvJquery("#bttvSettingsPanel #close").click(function () {
            bttvJquery("#bttvSettingsPanel").hide("slow");
        });

        bttvJquery("#bttvSettingsPanel .nav a").click(function (e) {
            e.preventDefault();
            var tab = bttvJquery(this).attr("href");

            bttvJquery("#bttvSettingsPanel .nav a").each(function () {
                var currentTab = bttvJquery(this).attr("href");
                bttvJquery(currentTab).hide();
                bttvJquery(this).parent("li").removeClass("active");
            });

            bttvJquery(tab).fadeIn();
            bttvJquery(this).parent("li").addClass("active");
        });

        bttvJquery('.option input:radio').change(function (e) {
            betterttvAction(e.target.name);
        });

        bttvJquery('.dropmenu_action').each(function () {
            bttvJquery(this).css("color", "#ffffff");
        });

        bttvJquery(window).konami({callback:function(){
            bttvJquery("#bttvSettingsPanel .bttvHiddenSetting").each(function () {
                bttvJquery(this).show();
            });
        }});

        bttvJquery('#chat_timestamps').attr("onclick", 'toggle_checkbox("toggle_chat_timestamps");betterttvAction("toggleTimestamps");');
        bttvJquery('#mod_icons').parent().attr("onclick", 'toggle_checkbox("mod_icons");betterttvAction("toggleModIcons");');
        bttvJquery('#mod_icons').attr("id", "mod_icons_bttv");

        bttvSettings["darkenedMode"] === true ? bttvJquery('#darkenedModeTrue').prop('checked', true) : bttvJquery('#darkenedModeFalse').prop('checked', true)
        bttvSettings["showDefaultEmotes"] === true ? bttvJquery('#defaultEmotesTrue').prop('checked', true) : bttvJquery('#defaultEmotesFalse').prop('checked', true);
        bttvSettings["showDefaultTags"] !== true ? bttvJquery('#defaultTagsFalse').prop('checked', true) : bttvJquery('#defaultTagsTrue').prop('checked', true);
        bttvSettings["showDirectoryLiveTab"] === true ? bttvJquery('#directoryLiveTabTrue').prop('checked', true) : bttvJquery('#directoryLiveTabFalse').prop('checked', true);
        bttvSettings["showTimestamps"] === true ? bttvJquery('#toggle_chat_timestamps').prop('checked', true) : bttvJquery('#toggle_chat_timestamps').prop('checked', false);
        bttvSettings["showModIcons"] === true ? bttvJquery('#mod_icons_bttv').prop('checked', true) : bttvJquery('#mod_icons_bttv').prop('checked', false);
        bttvSettings["showPurpleButtons"] === true ? bttvJquery('#defaultPurpleButtonsTrue').prop('checked', true) : bttvJquery('#defaultPurpleButtonsFalse').prop('checked', true);
        bttvSettings["splitChat"] === false ? bttvJquery('#splitChatFalse').prop('checked', true) : bttvJquery('#splitChatTrue').prop('checked', true);
        bttvSettings["selfHighlights"] !== false ? bttvJquery('#selfHighlightsTrue').prop('checked', true) : bttvJquery('#selfHighlightsFalse').prop('checked', true);
        bttvSettings["showFeaturedChannels"] === true ? bttvJquery('#featuredChannelsTrue').prop('checked', true) : bttvJquery('#featuredChannelsFalse').prop('checked', true);
        bttvSettings["showDeletedMessages"] === true ? bttvJquery('#showDeletedMessagesTrue').prop('checked', true) : bttvJquery('#showDeletedMessagesFalse').prop('checked', true);
        bttvSettings["bttvChat"] === true ? bttvJquery('#showBTTVChatTrue').prop('checked', true) : bttvJquery('#showBTTVChatFalse').prop('checked', true);
        bttvSettings["bttvEmotes"] === false ? bttvJquery('#showBTTVEmotesFalse').prop('checked', true) : bttvJquery('#showBTTVEmotesTrue').prop('checked', true);
        bttvSettings["hideDeletedMessages"] === true ? bttvJquery('#hideDeletedMessagesTrue').prop('checked', true) : bttvJquery('#hideDeletedMessagesFalse').prop('checked', true);
        bttvSettings["adminStaffAlert"] === true ? bttvJquery('#adminStaffAlertTrue').prop('checked', true) : bttvJquery('#adminStaffAlertFalse').prop('checked', true);
        bttvSettings["clickTwitchEmotes"] === true ? bttvJquery('#clickTwitchEmotesTrue').prop('checked', true) : bttvJquery('#clickTwitchEmotesFalse').prop('checked', true);
        bttvSettings["antiPrefix"] === true ? bttvJquery('#antiPrefixTrue').prop('checked', true) : bttvJquery('#antiPrefixFalse').prop('checked', true);
        bttvSettings["bttvHLS"] === true ? bttvJquery('#showBTTVHLSTrue').prop('checked', true) : bttvJquery('#showBTTVHLSFalse').prop('checked', true);
        
    }

    betterttvAction = function (action) {
        ga('send', 'event', 'BTTV', 'Action: '+action);
        if (action === "clearChat") {
            removeElement(".line");
            CurrentChat.admin_message("You cleared your own chat (BetterTTV)");
        }
        if (action === "openSettings") {
            bttvJquery('#chat_settings_dropmenu').hide();
            bttvJquery('#bttvSettingsPanel').show("slow");
        }
        if (action === "setHighlightKeywords") {
            var keywords = prompt("Type some highlight keywords. Messages containing keywords will turn red to get your attention. Placing your own username here will cause BetterTTV to highlight your own lines. Use spaces in the field to specify multiple keywords. Place {} around a set of words to form a phrase.", bttvSettings["highlightKeywords"]);
            if (keywords != null) {
                keywords = keywords.trim().replace(/\s\s+/g, ' ');
                bttvChangeSetting("highlightKeywords", keywords);
                var phraseRegex = /\{.+?\}/g;
                var testCases =  keywords.match(phraseRegex);
                var phraseKeywords = [];
                if(testCases) {
                    for (i=0;i<testCases.length;i++) {
                        var testCase = testCases[i];
                        keywords = keywords.replace(testCase, "").replace(/\s\s+/g, ' ').trim();
                        phraseKeywords.push('"'+testCase.replace(/(^\{|\}$)/g, '').trim()+'"');
                    }
                }

                keywords === "" ? keywords = phraseKeywords : keywords = keywords.split(" ").concat(phraseKeywords);

                if(keywords.indexOf(Twitch.user.login()) !== -1 && bttvSettings["selfHighlights"] !== false) {
                    CurrentChat.admin_message("Warning: You placed your username in the keywords list. Messages you type will turn red.");
                } else {
                    if (bttvSettings["selfHighlights"] !== false) {
                        keywords.unshift(Twitch.user.login());
                    }
                }
                
                var keywordList = keywords.join(", ");
                if(keywordList === "") {
                    CurrentChat.admin_message("Highlight Keywords list is empty");
                } else {
                    CurrentChat.admin_message("Highlight Keywords are now set to: " + keywordList);
                }
                
            }
        }
        if (action === "setBlacklistKeywords") {
            var keywords = prompt("Type some blacklist keywords. Messages containing keywords will be filtered from your chat. Use spaces in the field to specify multiple keywords. Place {} around a set of words to form a phrase.", bttvSettings["blacklistKeywords"]);
            if (keywords != null) {
                keywords = keywords.trim().replace(/\s\s+/g, ' ');
                bttvChangeSetting("blacklistKeywords", keywords);
                var phraseRegex = /\{.+?\}/g;
                var testCases =  keywords.match(phraseRegex);
                var phraseKeywords = [];
                if(testCases) {
                    for (i=0;i<testCases.length;i++) {
                        var testCase = testCases[i];
                        keywords = keywords.replace(testCase, "").replace(/\s\s+/g, ' ').trim();
                        phraseKeywords.push('"'+testCase.replace(/(^\{|\}$)/g, '').trim()+'"');
                    }
                }
                keywords === "" ? keywords = phraseKeywords : keywords = keywords.split(" ").concat(phraseKeywords);
                var keywordList = keywords.join(", ");
                if(keywordList === "") {
                    CurrentChat.admin_message("Blacklist Keywords list is empty");
                } else {
                    CurrentChat.admin_message("Blacklist Keywords are now set to: " + keywordList);
                }
            }
        }
        if (action === "setScrollbackAmount") {
            var lines = prompt("What is the maximum amount of lines that you want your chat to show? Twitch default is 150. Leave the field blank to disable.", bttvSettings["scrollbackAmount"]);
            if (lines != null && lines === "") {
                bttvChangeSetting("scrollbackAmount", 150);
                CurrentChat.admin_message("Chat scrollback is now set to: default (150)");
                CurrentChat.line_buffer = 150;
            } else if (lines != null && isNaN(lines) !== true && lines > 0) {
                bttvChangeSetting("scrollbackAmount", lines);
                CurrentChat.admin_message("Chat scrollback is now set to: " + lines);
                CurrentChat.line_buffer = parseInt(lines);
            } else {
                CurrentChat.admin_message("Invalid scrollback amount given. Value not saved.");
            }
        }
        if (action === "flipDashboard") {
            if (bttvSettings["flipDashboard"] === true) {
                bttvChangeSetting("flipDashboard", false);
                bttvJquery("#flipDashboard").html("Flip Dashboard");
                bttvJquery("#controls_column, #player_column").css({
                    float: "none",
                    marginLeft: "0px"
                });
                bttvJquery("#chat").css({
                    float: "right",
                    left: "",
                    right: "20px"
                });
            } else {
                bttvChangeSetting("flipDashboard", true);
                bttvJquery("#flipDashboard").html("Unflip Dashboard");
                flipDashboard();
            }
        }
        if (action === "toggleAdminStaffAlert") {
            if (bttvSettings["adminStaffAlert"] === true) {
                bttvChangeSetting("adminStaffAlert", false);
            } else {
                bttvChangeSetting("adminStaffAlert", true);
            }
        }
        if (action === "toggleAntiPrefix") {
            if (bttvSettings["antiPrefix"] === true) {
                bttvChangeSetting("antiPrefix", false);
            } else {
                bttvChangeSetting("antiPrefix", true);
            }
        }
        if (action === "toggleBTTVChat") {
            if (bttvSettings["bttvChat"] === true) {
                bttvChangeSetting("bttvChat", false);
                window.location.reload();
            } else {
                bttvChangeSetting("bttvChat", true);
                betaChat();
            }
        }
        if (action === "toggleBTTVEmotes") {
            if (bttvSettings["bttvEmotes"] === false) {
                bttvChangeSetting("bttvEmotes", true);
                overrideEmotes();
            } else {
                bttvChangeSetting("bttvEmotes", false);
                overrideEmotes();
            }
        }
        if (action === "toggleBTTVHLS") {
            if (bttvSettings["bttvHLS"] === true) {
                bttvChangeSetting("bttvHLS", false);
                bttvJquery("#bttvTranscodes").remove();
                if(bttvJquery("#live_site_player_flash").length && Twitch.player.playerBackup) {
                    bttvJquery("#live_site_player_flash").replaceWith(Twitch.player.playerBackup);
                }
            } else {
                bttvChangeSetting("bttvHLS", true);
                bttvJquery("#bttvTranscodes").remove();
                checkForTranscodes();
            }
        }
        if (action === "toggleClickTwitchEmotes") {
            if (bttvSettings["clickTwitchEmotes"] === true) {
                bttvChangeSetting("clickTwitchEmotes", false);
                window.location.reload();
            } else {
                bttvChangeSetting("clickTwitchEmotes", true);
                handleTwitchChatEmotesScript();
            }
        }
        if (action === "toggleDefaultEmotes") {
            if (bttvSettings["showDefaultEmotes"] === true) {
                bttvChangeSetting("showDefaultEmotes", false);
            } else {
                bttvChangeSetting("showDefaultEmotes", true);
            }
            overrideEmotes();
        }
        if (action === "toggleDefaultTags") {
            if (bttvSettings["showDefaultTags"] === true) {
                bttvChangeSetting("showDefaultTags", false);
            } else {
                bttvChangeSetting("showDefaultTags", true);
            }
        }
        if (action === "toggleDeletedMessages") {
            if (bttvSettings["showDeletedMessages"] === true) {
                bttvChangeSetting("showDeletedMessages", false);
            } else {
                bttvChangeSetting("showDeletedMessages", true);
            }
        }
        if (action === "toggleDirectoryLiveTab") {
            if (bttvSettings["showDirectoryLiveTab"] === true) {
                bttvChangeSetting("showDirectoryLiveTab", false);
            } else {
                bttvChangeSetting("showDirectoryLiveTab", true);
            }
        }
        if (action === "toggleHideDeletedMessages") {
            if (bttvSettings["hideDeletedMessages"] === true) {
                bttvChangeSetting("hideDeletedMessages", false);
            } else {
                bttvChangeSetting("hideDeletedMessages", true);
            }
        }
        if (action === "toggleTimestamps") {
            if (bttvSettings["showTimestamps"] === true) {
                bttvChangeSetting("showTimestamps", false);
            } else {
                bttvChangeSetting("showTimestamps", true);
            }
            bttvSettings["showTimestamps"] === true ? bttvJquery('#toggle_chat_timestamps').prop('checked', true) : bttvJquery('#toggle_chat_timestamps').prop('checked', false);
        }
        if (action === "toggleModIcons") {
            if (bttvSettings["showModIcons"] === true) {
                bttvChangeSetting("showModIcons", false);
            } else {
                bttvChangeSetting("showModIcons", true);
            }
            bttvSettings["showModIcons"] === true ? bttvJquery('#mod_icons_bttv').prop('checked', true) : bttvJquery('#mod_icons_bttv').prop('checked', false);
        }
        if (action === "togglePurpleButtons") {
            if (bttvSettings["showPurpleButtons"] === true) {
                bttvChangeSetting("showPurpleButtons", false);
                cssBlueButtons();
            } else {
                bttvChangeSetting("showPurpleButtons", true);
                bttvJquery("#bttvBlueButtons").remove();
            }
        }
        if (action === "toggleDarkTwitch") {
            if (bttvSettings["darkenedMode"] === true) {
                bttvChangeSetting("darkenedMode", false);
                bttvJquery("#darkTwitch").remove();
                handleBackground();
                if (bttvSettings["splitChat"] !== false) {
                    bttvJquery("#splitChat").remove();
                    splitChat();
                }
            } else {
                bttvChangeSetting("darkenedMode", true);
                darkenPage();
                if (bttvSettings["splitChat"] !== false) {
                    bttvJquery("#splitChat").remove();
                    splitChat();
                }
            }
        }
        if (action === "toggleSplitChat") {
            if (bttvSettings["splitChat"] === false) {
                bttvChangeSetting("splitChat", true);
                splitChat();
            } else {
                bttvChangeSetting("splitChat", false);
                bttvJquery("#splitChat").remove();
            }
        }
        if (action === "toggleBlackChat") {
            if (blackChat) {
                blackChat = false;
                bttvJquery("#blackChat").remove();
                darkenPage();
                splitChat();
                bttvJquery("#blackChatLink").html("Black Chat (Chroma Key)");
            } else {
                blackChat = true;
                bttvJquery("#darkTwitch").remove();
                bttvJquery("#splitChat").remove();
                var darkCSS = document.createElement("link");
                darkCSS.setAttribute("href", "http://cdn.betterttv.net/betterttv-blackchat.css");
                darkCSS.setAttribute("type", "text/css");
                darkCSS.setAttribute("rel", "stylesheet");
                darkCSS.setAttribute("id", "blackChat");
                darkCSS.innerHTML = '';
                bttvJquery('body').append(darkCSS);
                bttvJquery("#blackChatLink").html("Unblacken Chat");
            }
        }
        if (action === "toggleSelfHighlights") {
            if (bttvSettings["selfHighlights"] !== false) {
                bttvChangeSetting("selfHighlights", false);
            } else {
                bttvChangeSetting("selfHighlights", true);
            }
        }
        if (action === "toggleFeaturedChannels") {
            if (bttvSettings["showFeaturedChannels"] === true) {
                bttvChangeSetting("showFeaturedChannels", false);
                removeElement('.sm_vids');
                removeElement('#nav_games');
                removeElement('#nav_streams');
                removeElement('.featured');
                removeElement('.related');
            } else {
                bttvChangeSetting("showFeaturedChannels", true);
                displayElement('.sm_vids');
                displayElement('#nav_games');
                displayElement('#nav_streams');
                displayElement('.featured');
                displayElement('.related');
            }
        }
    }

    bttvHLSTranscodes = function () {
        Twitch.hls.requestPlaylistForChannel(CurrentChat.channel, function(location) {
            if(location) {
                bttvJquery.ajax({url: location, cache: !1, timeoutLength: 6E3}).done(function (playlist) {
                    if(playlist) {
                        var playlistRegex = /#EXT-X-STREAM-INF:PROGRAM-ID=1,BANDWIDTH=(.*),VIDEO="(.*)"\n(.*)\n/g;
                        playlistExists = playlist.match(playlistRegex);

                        if(playlistExists) {
                            Twitch.player.playerBackup = bttvJquery("#live_site_player_flash")[0];
                            bttvJquery("#live_site_player_flash").replaceWith('<embed type="application/x-vlc-plugin" width="100%" height="100%" name="live_site_player_flash" id="live_site_player_flash" loop="no" autoplay="yes" target=""></embed>');
                            bttvJquery("#live_site_player_flash").css("visibility","inherit");
                            bttvJquery("#bttvTranscodes").remove();
                            bttvJquery("#stats_and_actions").prepend('<div id="bttvTranscodes">Change your resolution: <a href="#" id="bttv_changeres_twitch">Normal Twitch Player</a></div>');
                            bttvJquery("#bttv_changeres_twitch").click(function() {
                                bttvJquery("#live_site_player_flash").replaceWith(Twitch.player.playerBackup);
                                delete Twitch.player.playerBackup;
                                bttvJquery("#bttvTranscodes").remove();
                                checkForTranscodes();
                            });
                            var count = 0,
                                stream;
                            while((stream = playlistRegex.exec(playlist)) !== null) {
                                var bandwidth = Math.round(stream[1]/1024),
                                    name = stream[2].capitalize(),
                                    res = name.replace("High","720p").replace("Medium","360p").replace("Low","226p").replace("Chunked","Source");
                                    url = stream[3];

                                count++;
                                bttvJquery("#live_site_player_flash")[0].playlist.add(url,name);
                                bttvJquery("#bttvTranscodes").append(' | <a href="#" id="bttv_changeres_'+name+'" data-num="'+count+'">'+name+' ('+res+' @ '+bandwidth+'kbps)</a>');
                                bttvJquery("#bttv_changeres_"+name).click(function() {
                                    bttvJquery("#live_site_player_flash")[0].playlist.playItem(bttvJquery(this).data("num"));
                                });
                            }
                        }
                    }
                });
            }
        });   
    }

    checkForTranscodes = function() {
        if(typeof CurrentChat == "undefined" || !CurrentChat.channel) return;

        if(bttvSettings["bttvHLS"] === true) {
            bttvJquery.ajax({url: "http://www.twitch.tv/meta/"+CurrentChat.channel+".xml", cache: !1, timeoutLength: 6E3, dataType: 'xml'}).done(function (channelInfo) {
                if(channelInfo) {
                    if(bttvJquery(channelInfo).find("partner_program").text() === "true") return;
                    Twitch.hls.requestPlaylistForChannel(CurrentChat.channel, function(location) {
                        if(location) {
                            bttvJquery("#stats_and_actions").prepend('<div id="bttvTranscodes">Change your resolution: <a href="#" id="bttv_changeres_init">Enable BetterTTV HLS Beta</a> (Requires the <a href="http://www.videolan.org/vlc/index.html" target="_blank">VLC media player</a>)</div>');
                            bttvJquery("#bttv_changeres_init").click(function() {
                                bttvHLSTranscodes();
                            });
                        }
                    });
                }
            });
        }
    }

    checkJquery = function () {
        if (typeof ($j) === 'undefined') {
            bttvDebug.log("jQuery is undefined.");
            setTimeout(checkJquery, 1000);
            return;
        } else {
            bttvJquery = $j;
            main();
        }
    }

    loadSettings = function () {
        var parseSetting = function(value) {
            if(value == null) {
                return null;
            } else if(value === "true") {
                return true;
            } else if(value === "false") {
                return false;
            } else if(value === "") {
                return "";
            } else if(isNaN(value) === false) {
                return parseInt(value);
            } else {
                return value;
            }
        }
        var settingsList = [
                                "adminStaffAlert",
                                "antiPrefix",
                                "blacklistKeywords",
                                "bttvChat",
                                "bttvEmotes",
                                "bttvHLS",
                                "chatWidth",
                                "clickTwitchEmotes",
                                "darkenedMode",
                                "flipDashboard",
                                "hideDeletedMessages",
                                "highlightKeywords",
                                "scrollbackAmount",
                                "selfHighlights",
                                "showDefaultEmotes",
                                "showDefaultTags",
                                "showDeletedMessages",
                                "showDirectoryLiveTab",
                                "showFeaturedChannels",
                                "showModIcons",
                                "showPurpleButtons",
                                "showTimestamps",
                                "splitChat"
                           ]
        settingsList.forEach(function(setting) {
            bttvSettings[setting] = parseSetting(localStorage.getItem(setting));
        });
    }

    bttvChangeSetting = function(setting, value) {
        ga('send', 'event', 'BTTV', 'Change Setting: '+setting+'='+value);
        bttvSettings[setting] = value;
        localStorage.setItem(setting, value);
    }

    main = function () {
        loadSettings();
        
        bttvJquery(document).ready(function () {
            bttvDebug.log("BTTV v" + bttvVersion + 'R' + bttvRelease);
            bttvDebug.log("CALL init " + document.URL);

            brand();
            clearClutter();
            channelReformat();
            checkMessages();
            checkFollowing();
            handleTwitchChatEmotesScript();
            darkenPage();
            splitChat();
            flipDashboard();
            formatDashboard();
            giveawayCompatibility();
            dashboardViewers();
            directoryLiveTab();
            
            bttvJquery(window).trigger('resize');
            setTimeout(chatFunctions, 3000);
            setTimeout(createSettingsMenu, 1000);
            setTimeout(checkForTranscodes, 5000);
            setTimeout(directoryLiveTab, 5000);

            (function(b){b.gritter={};b.gritter.options={position:"top-left",class_name:"",fade_in_speed:"medium",fade_out_speed:1000,time:6000};b.gritter.add=function(f){try{return a.add(f||{})}catch(d){var c="Gritter Error: "+d;(typeof(console)!="undefined"&&console.error)?console.error(c,f):alert(c)}};b.gritter.remove=function(d,c){a.removeSpecific(d,c||{})};b.gritter.removeAll=function(c){a.stop(c||{})};var a={position:"",fade_in_speed:"",fade_out_speed:"",time:"",_custom_timer:0,_item_count:0,_is_setup:0,_tpl_close:'<div class="gritter-close"></div>',_tpl_title:'<span class="gritter-title">[[title]]</span>',_tpl_item:'<div id="gritter-item-[[number]]" class="gritter-item-wrapper [[item_class]]" style="display:none"><div class="gritter-top"></div><div class="gritter-item">[[close]][[image]]<div class="[[class_name]]">[[title]]<p>[[text]]</p></div><div style="clear:both"></div></div><div class="gritter-bottom"></div></div>',_tpl_wrap:'<div id="gritter-notice-wrapper"></div>',add:function(g){if(typeof(g)=="string"){g={text:g}}if(!g.text){throw'You must supply "text" parameter.'}if(!this._is_setup){this._runSetup()}var k=g.title,n=g.text,e=g.image||"",l=g.sticky||false,m=g.class_name||b.gritter.options.class_name,j=b.gritter.options.position,d=g.time||"";this._verifyWrapper();this._item_count++;var f=this._item_count,i=this._tpl_item;b(["before_open","after_open","before_close","after_close"]).each(function(p,q){a["_"+q+"_"+f]=(b.isFunction(g[q]))?g[q]:function(){}});this._custom_timer=0;if(d){this._custom_timer=d}var c=(e!="")?'<img src="'+e+'" class="gritter-image" />':"",h=(e!="")?"gritter-with-image":"gritter-without-image";if(k){k=this._str_replace("[[title]]",k,this._tpl_title)}else{k=""}i=this._str_replace(["[[title]]","[[text]]","[[close]]","[[image]]","[[number]]","[[class_name]]","[[item_class]]"],[k,n,this._tpl_close,c,this._item_count,h,m],i);if(this["_before_open_"+f]()===false){return false}b("#gritter-notice-wrapper").addClass(j).append(i);var o=b("#gritter-item-"+this._item_count);o.fadeIn(this.fade_in_speed,function(){a["_after_open_"+f](b(this))});if(!l){this._setFadeTimer(o,f)}b(o).bind("mouseenter mouseleave",function(p){if(p.type=="mouseenter"){if(!l){a._restoreItemIfFading(b(this),f)}}else{if(!l){a._setFadeTimer(b(this),f)}}a._hoverState(b(this),p.type)});b(o).find(".gritter-close").click(function(){a.removeSpecific(f,{},null,true)});return f},_countRemoveWrapper:function(c,d,f){d.remove();this["_after_close_"+c](d,f);if(b(".gritter-item-wrapper").length==0){b("#gritter-notice-wrapper").remove()}},_fade:function(g,d,j,f){var j=j||{},i=(typeof(j.fade)!="undefined")?j.fade:true,c=j.speed||this.fade_out_speed,h=f;this["_before_close_"+d](g,h);if(f){g.unbind("mouseenter mouseleave")}if(i){g.animate({opacity:0},c,function(){g.animate({height:0},300,function(){a._countRemoveWrapper(d,g,h)})})}else{this._countRemoveWrapper(d,g)}},_hoverState:function(d,c){if(c=="mouseenter"){d.addClass("hover");d.find(".gritter-close").show()}else{d.removeClass("hover");d.find(".gritter-close").hide()}},removeSpecific:function(c,g,f,d){if(!f){var f=b("#gritter-item-"+c)}this._fade(f,c,g||{},d)},_restoreItemIfFading:function(d,c){clearTimeout(this["_int_id_"+c]);d.stop().css({opacity:"",height:""})},_runSetup:function(){for(opt in b.gritter.options){this[opt]=b.gritter.options[opt]}this._is_setup=1},_setFadeTimer:function(f,d){var c=(this._custom_timer)?this._custom_timer:this.time;this["_int_id_"+d]=setTimeout(function(){a._fade(f,d)},c)},stop:function(e){var c=(b.isFunction(e.before_close))?e.before_close:function(){};var f=(b.isFunction(e.after_close))?e.after_close:function(){};var d=b("#gritter-notice-wrapper");c(d);d.fadeOut(function(){b(this).remove();f()})},_str_replace:function(v,e,o,n){var k=0,h=0,t="",m="",g=0,q=0,l=[].concat(v),c=[].concat(e),u=o,d=c instanceof Array,p=u instanceof Array;u=[].concat(u);if(n){this.window[n]=0}for(k=0,g=u.length;k<g;k++){if(u[k]===""){continue}for(h=0,q=l.length;h<q;h++){t=u[k]+"";m=d?(c[h]!==undefined?c[h]:""):c[0];u[k]=(t).split(l[h]).join(m);if(n&&u[k]!==t){this.window[n]+=(t.length-u[k].length)/l[h].length}}}return p?u:u[0]},_verifyWrapper:function(){if(b("#gritter-notice-wrapper").length==0){b("body").append(this._tpl_wrap)}}}})(bttvJquery);
            
            (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
            (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
            m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
            })(window,document,'script','//www.google-analytics.com/analytics.js','ga');

            (function(e){e.fn.konami=function(t){var n=[];var r={left:37,up:38,right:39,down:40,a:65,b:66};var i=e.extend({code:["up","up","down","down","left","right","left","right","b","a"],callback:function(){}},t);var s=i.code;var o=[];bttvJquery.each(s,function(e){if(s[e]!==undefined&&r[s[e]]!==undefined){o.push(r[s[e]])}else if(s[e]!==undefined&&typeof s[e]=="number"){o.push(s[e])}});bttvJquery(document).keyup(function(e){var t=e.keyCode?e.keyCode:e.charCode;n.push(t);if(n.toString().indexOf(o)>=0){n=[];i.callback(bttvJquery(this))}})}})(bttvJquery);

            ga('create', 'UA-39733925-4', 'betterttv.net');
            ga('send', 'pageview');
        });
    }

    if (document.URL.indexOf("receiver.html") !== -1 || document.URL.indexOf("cbs_ad_local.html") !== -1) {
        bttvDebug.log("HTML file called by Twitch.");
        return;
    }

    if(location.pathname.match(/^\/(.*)\/popout/)) {
        bttvDebug.log("Popout player detected.");
        return;
    }

    try {
        if (BTTVLOADED === true) return;
    } catch (err) {
        bttvDebug.log("BTTV LOADED " + document.URL);
        BTTVLOADED = true;
        checkJquery();
    }

}();