/*
    Copyright 2014 Jaycliff Arcilla of Eversun Software Philippines Corporation (Davao Branch)
    
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
/*jslint browser: true, devel: true */
/*global jQuery*/
(function ($) {
    "use strict";
    // $.fn === $.prototype
    var $document = $(document),
        list_of_csb = [],
        hasClass,
        addClass,
        removeClass;
    if (!document.documentElement.classList) {
        (function () {
            var collection_of_regex = {};
            hasClass = function (element, cls) {
                if (!collection_of_regex.hasOwnProperty(cls)) {
                    collection_of_regex[cls] = new RegExp('(?:^|\\s)' + cls + '(?!\\S)', 'g');
                }
                return element.className.match(collection_of_regex[cls]);
            };
            addClass = function (element, cls) {
                if (!hasClass(element, cls)) {
                    element.className += (' ' + cls);
                }
            };
            removeClass = function (element, cls) {
                if (!collection_of_regex.hasOwnProperty(cls)) {
                    collection_of_regex[cls] = new RegExp('(?:^|\\s)' + cls + '(?!\\S)', 'g');
                }
                element.className = element.className.replace(collection_of_regex[cls], '');
            };
        }());
    } else {
        hasClass = function (element, cls) {
            return element.classList.contains(cls);
        };
        addClass = function (element, cls) {
            element.classList.add(cls);
        };
        removeClass = function (element, cls) {
            element.classList.remove(cls);
        };
    }
    function createSelectBoxStructure($this) {
        var wrap = document.createElement('div'),
            $wrap,
            csb_single,
            $csb_single,
            csb_label,
            $csb_label,
            csb_drop,
            $csb_drop,
            csb_arrow,
            csb_option_list,
            optgroup,
            // children contains all options and optgroups of a given select element. used in generating the list items of the proxy
            children = [],
            list_pool,
            selected_item = null,
            index = 0;
        // update the list of option and optgroups (children)
        function updateChildren() {
            var parent = $this[0], i, a, len1 = parent.children.length, len2, og;
            children.length = 0;
            for (i = 0; i < len1; i += 1) {
                switch (parent.children[i].tagName.toLowerCase()) {
                case 'optgroup':
                    og = parent.children[i];
                    children.push(og);
                    for (a = 0, len2 = og.children.length; a < len2; a += 1) {
                        if (og.children[a].tagName.toLowerCase() === 'option') {
                            children.push(og.children[a]);
                        }
                    }
                    break;
                case 'option':
                    children.push(parent.children[i]);
                    break;
                }
            }
        }
        updateChildren();
        function closeCSB() {
            removeClass(csb_single.parentNode, 'csb-with-drop');
            removeClass(csb_single.parentNode, 'csb-container-active');
            $document.off('mousedown', closeCSB);
        }
        function openCSB() {
            var i, length = list_of_csb.length;
            for (i = 0; i < length; i += 1) {
                list_of_csb[i].trigger('csb:close-proxy');
            }
            addClass(csb_single.parentNode, 'csb-with-drop');
            addClass(csb_single.parentNode, 'csb-container-active');
            $document.on('mousedown', closeCSB);
        }
        $this.on('csb:close-proxy', closeCSB);
        $this.on('csb:open-proxy', openCSB);
        // this is where the list elements get created/recycled
        list_pool = (function listPoolSetup() {
            var pool = [];
            return {
                'summon': function summon() {
                    var list;
                    if (pool.length > 0) {
                        return pool.pop();
                    }
                    list = document.createElement('li');
                    return list;
                },
                'shave': function shave(parent) {
                    var offspring, item;
                    if (parent.children.length > 0) {
                        offspring = parent.children;
                        while (offspring.length) {
                            item = parent.removeChild(offspring[0]);
                            item.textContent = '';
                            item.removeAttribute('class');
                            item.removeAttribute('data-csb-option-index');
                            pool.push(item);
                        }
                    }
                }
            };
        }());
        addClass(wrap, 'csb-container');
        addClass(wrap, 'csb-container-single');
        if ($this.prop('disabled')) {
            addClass(wrap, 'csb-disabled');
        }
        csb_single = document.createElement('div');
        addClass(csb_single, 'csb-single');
        csb_label = document.createElement('span');
        addClass(csb_label, 'csb-label');
        csb_single.appendChild(csb_label);
        csb_arrow = document.createElement('span');
        addClass(csb_arrow, 'csb-arrow');
        csb_single.appendChild(csb_arrow);
        wrap.appendChild(csb_single);
        // bottom
        csb_drop = document.createElement('div');
        addClass(csb_drop, 'csb-drop');
        csb_option_list = document.createElement('ul');
        addClass(csb_option_list, 'csb-option-list');
        function createDropdownStructure() {
            var i, length, li;
            for (i = 0, length = children.length; i < length; i += 1) {
                li = list_pool.summon();
                switch (children[i].tagName.toLowerCase()) {
                case 'optgroup':
                    optgroup = children[i];
                    addClass(li, 'group-result');
                    li.textContent = children[i].label;
                    break;
                case 'option':
                    if (!children[i].disabled) {
                        addClass(li, 'active-result');
                    } else {
                        addClass(li, 'disabled-result');
                    }
                    $.data(li, 'csb-option-index', index);
                    if (optgroup && children[i].parentNode === optgroup) {
                        addClass(li, 'group-option');
                    }
                    li.textContent = children[i].textContent;
                    //console.log($this[0].name);
                    if (children[i].value === $this[0].value && index === $this[0].selectedIndex) {
                        if ($this[0].selectedIndex === 0) {
                            addClass(csb_single, 'csb-default');
                        }
                        csb_label.textContent = li.textContent;
                        addClass(li, 'csb-selected');
                        selected_item = li;
                        if (children[i].disabled) {
                            //addClass(csb_single, 'csb-default');
                            addClass(li, 'disabled-result');
                        }
                    }
                    index += 1;
                    break;
                }
                csb_option_list.appendChild(li);
            }
        }
        createDropdownStructure();
        csb_drop.appendChild(csb_option_list);
        wrap.appendChild(csb_drop);
        $this.data('csb:refresh-proxy-structure', function () {
            list_pool.shave(csb_option_list);
            updateChildren();
            removeClass(csb_single, 'csb-default');
            index = 0;
            createDropdownStructure();
        });
        $this.data('list-pool', list_pool);
        $this.after(wrap);
        $wrap = $(wrap);
        $this.data('csb-$wrap', $wrap);
        $csb_single = $(csb_single);
        $this.data('csb-$csb_single', $csb_single);
        $csb_single.on('mousedown', function (event) {
            event.stopPropagation();
            if ($this[0].disabled) {
                return;
            }
            if (!hasClass(csb_single.parentNode, 'csb-with-drop')) {
                openCSB();
            } else {
                closeCSB();
            }
        });
        $csb_label = $(csb_label);
        $this.data('csb-$csb_label', $csb_label);
        $csb_drop = $(csb_drop);
        $csb_drop.on('mousedown', function (event) {
            event.stopPropagation();
        });
        $csb_drop.on('mousedown', 'li.active-result', function () {
            var option_index = $.data(this, 'csb-option-index');
            removeClass(csb_single, 'csb-empty');
            if (option_index > 0) {
                removeClass(csb_single, 'csb-default');
            } else {
                addClass(csb_single, 'csb-default');
            }
            removeClass(selected_item, 'csb-selected');
            selected_item = this;
            addClass(this, 'csb-selected');
            $this.prop('selectedIndex', option_index).trigger('change');
            csb_label.textContent = this.textContent;
            //console.log(option_index);
            closeCSB();
        });
        // return the newly created elements
        return wrap;
    }
    function eacher() {
        var $this, options = eacher.options || { 'min-width': '50px' }, key;
        if (this.tagName.toLowerCase() === 'select') {
            if (!$.data(this, 'csb-$this')) {
                $this = $(this);
                list_of_csb.push($this);
                $.data(this, 'csb-$this', $this);
                $.data(this, 'csb-proxy', createSelectBoxStructure($this));
                for (key in options) {
                    if (options.hasOwnProperty(key)) {
                        switch (key) {
                        case 'width':
                            $this.data('csb-$wrap').css('width', options[key]);
                            break;
                        case 'min-width':
                            $this.data('csb-$wrap').css('min-width', options[key]);
                            break;
                        }
                    }
                }
                $this.on('csb:update-proxy', function () {
                    //console.log('This is where we update the proxy');
                    if (this.selectedIndex === -1) {
                        $this.data('csb-$csb_label').text(this.getAttribute('data-placeholder'));
                        addClass($this.data('csb-$csb_single')[0], 'csb-empty');
                    } else {
                        $this.data('csb-$csb_label').text($this[0].value);
                        removeClass($this.data('csb-$csb_single')[0], 'csb-empty');
                    }
                    if ($this.prop('disabled')) {
                        addClass($this.data('csb-$wrap')[0], 'csb-disabled');
                    } else {
                        removeClass($this.data('csb-$wrap')[0], 'csb-disabled');
                    }
                    $this.data('csb:refresh-proxy-structure')();
                });
                // Start experiment
                Object.defineProperty($this.get(0), 'csbSelectedIndex', {
                    get: function getter() {
                        return this.selectedIndex;
                    },
                    set: function setter(value) {
                        this.selectedIndex = value;
                        $this.trigger('csb:update-proxy');
                    }
                });
                // End experiment
                $this.hide();
            } else {
                $this = $.data(this, 'csb-$this');
            }
            //console.log('Plugin is not ready');
        }
    }
    $.fn.extend({
        customSelectBox: function customSelectBox(options) {
            if (!options) {
                if (eacher.hasOwnProperty('options')) {
                    delete eacher.options;
                }
            } else {
                eacher.options = options;
            }
            this.each(eacher);
        }
    });
}(jQuery));
