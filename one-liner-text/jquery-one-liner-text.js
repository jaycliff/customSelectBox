/*
    Copyright 2016 Jaycliff Arcilla of Eversun Software Philippines Corporation

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

        http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
*/
/*
    DEPENDENCIES:
        jQuery library
*/
/*global jQuery, HTMLCollection, NodeList, Element*/
(function ($, NodeList, HTMLCollection, Element) {
    "use strict";
    $.fn.oneLinerText = (function () {
        var pool_of_span = (function () {
            var pool = [], decoy = document.createElement('br');
            return {
                summon: function summon(parent) {
                    var span, child;
                    if (pool.length > 0) {
                        span = pool.pop();
                    } else {
                        span = document.createElement('span');
                        $.data(span, '$self', $(span).data('oneLinerText:animate_options', { scrollLeft: 0 }));
                        span.setAttribute('style', 'display: inline-block; max-width: 100%; overflow-x: hidden; vertical-align: top; white-space: nowrap;');
                    }
                    child = parent.firstChild;
                    while (child) {
                        span.appendChild(child);
                        child = parent.firstChild;
                    }
                    parent.appendChild(span);
                    return span;
                },
                banish: function banish(span) {
                    var parent = span.parentElement, gramps = parent.parentElement, child;
                    gramps.replaceChild(decoy, parent); // Remove parent to avoid dom reflows when reattaching children
                    parent.removeChild(span);
                    child = span.firstChild;
                    while (child) {
                        parent.appendChild(child);
                        child = span.firstChild;
                    }
                    gramps.replaceChild(parent, decoy); // Reattach parent to gramps
                    pool.push(span);
                    return this;
                }
            };
        }()), oltDOM, hasOwnProperty = Object.prototype.hasOwnProperty, min = Math.min;
        function mouseHandler(event) {
            /*jshint validthis: true*/
            var pps = $.data(this, 'oneLinerText:pps'),
                span = $.data(this, 'oneLinerText:span'),
                $span = $.data(span, '$self'),
                animate_options,
                scrollLeftMax;
            switch (event.type) {
            case 'mousedown':
                if (event.which === 2 && $span.is(':animated')) {
                    event.preventDefault();
                    event.stopImmediatePropagation();
                    $span.stop(true);
                }
                break;
            case 'mouseup':
                if (event.which === 2 && !$span.is(':animated')) {
                    event.preventDefault();
                    event.stopImmediatePropagation();
                } else {
                    break;
                }
                /* falls through */
            case 'mouseenter':
                // http://stackoverflow.com/questions/5138373/how-do-i-get-the-max-value-of-scrollleft
                animate_options = $span.data('oneLinerText:animate_options');
                scrollLeftMax = span.scrollWidth - span.clientWidth;
                animate_options.scrollLeft = scrollLeftMax;
                $span.stop(true).animate(animate_options, (scrollLeftMax - span.scrollLeft) * pps, 'linear');
                break;
            case 'mouseleave':
                animate_options = $span.data('oneLinerText:animate_options');
                animate_options.scrollLeft = 0;
                $span.stop(true).animate(animate_options, min(span.scrollLeft, 100), 'linear');
                break;
            }
        }
        function eachHandler() {
            /*jshint validthis: true*/
            var destroy = !!eachHandler._destroy,
                style,
                prev_ox,
                prev_ws,
                self = this,
                $self = $.data(self, '$self');
            if (!($self instanceof $)) {
                $self = $(self);
                $.data(self, '$self', $self);
            }
            if (!$self.data('oneLinerText:span')) {
                if (!destroy) {
                    style = self.style;
                    prev_ox = style.overflowX;
                    prev_ws = style.whiteSpace;
                    style.overflowX = 'hidden';
                    style.whiteSpace = 'nowrap';
                    $self.data('oneLinerText:span', pool_of_span.summon(self)).data('oneLinerText:pps', eachHandler._pps).on('mousedown mouseup mouseenter mouseleave', mouseHandler).attr('data-one-liner-text', true);
                    style.overflowX = prev_ox;
                    style.whiteSpace = prev_ws;
                }
            } else {
                if (destroy) {
                    pool_of_span.banish($self.data('oneLinerText:span'));
                    $self.removeData('oneLinerText:span').removeData('oneLinerText:pps').off('mousedown mouseup mouseenter mouseleave', mouseHandler).removeAttr('data-one-liner-text');
                } else {
                    if (eachHandler._overwrite) {
                        $self.data('oneLinerText:pps', eachHandler._pps);
                    }
                }
            }
        }
        oltDOM = function oneLinerText(collection, param) {
            var k, len;
            if (collection instanceof $ || collection instanceof NodeList || collection instanceof HTMLCollection || (hasOwnProperty.call(collection, 'length') && typeof collection.length === "number" && collection.length > -1)) {
                eachHandler._destroy = false;
                eachHandler._pps = 1000 / 60;
                eachHandler._overwrite = false;
                switch (typeof param) {
                case 'string':
                    if (param === 'destroy' || param === 'remove' || param === 'kill' || param === 'obliterate') {
                        eachHandler._destroy = true;
                    }
                    break;
                case 'number':
                    if (param > 0) {
                        eachHandler._pps = 1000 / param;
                        eachHandler._overwrite = true;
                    }
                    break;
                default:
                    if (arguments.length > 1) {
                        throw new TypeError('Invalid parameter type');
                    }
                }
                for (k = 0, len = collection.length; k < len; k += 1) {
                    eachHandler.call(collection[k]);
                }
            } else {
                if (collection instanceof Element) {
                    eachHandler.call(collection);
                }
            }
            return oneLinerText;
        };
        $.oneLinerText = oltDOM;
        return function oneLinerText(param) {
            if (arguments.length) {
                oltDOM.call(null, this, param);
            } else {
                oltDOM.call(null, this);
            }
            return this; // Allow method-chaining like most jQuery plugins and methods
        };
    }());
}(typeof jQuery === "function" && jQuery, NodeList, HTMLCollection, Element));