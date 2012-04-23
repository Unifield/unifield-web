/*---------------------------------------------------------
 * OpenERP base_hello (Example module)
 *---------------------------------------------------------*/

openerp.web_msf = function(openerp) {

openerp.web.search.Field.prototype.on_ui_change = function() {
            this.view.do_onchange(this);
}

/*openerp.web.search.Field.prototype.init = function(view, node) {
    this._super.apply(this, arguments);
    view.fields[this.name] = this;
}*/

openerp.web.search.SelectionField = openerp.web.search.SelectionField.extend({
    start: function () {
        this._super.apply(this, arguments);
        this.$element.change(this.on_ui_change);
    }
})

openerp.web.SearchView = openerp.web.SearchView.extend({
    init: function(parent, dataset, view_id, defaults, hidden) {
        this._super.apply(this, arguments);
        this.fields = {}
        this.on_change_mutex = new $.Mutex();
    },
    make_field: function (item, field) {
        f = this._super.apply(this, arguments);
        if (f !== null) {
            this.fields[item['attrs'].name] = f;
        }
        return f;
    },
    parse_on_change: function (on_change, widget) {
        var self = this;
        var onchange = _.str.trim(on_change);
        var call = onchange.match(/^\s?(.*?)\((.*?)\)\s?$/);
        if (!call) {
            return null;
        }

        var method = call[1];
        if (!_.str.trim(call[2])) {
            return {method: method, args: [], context_index: null}
        }

        var argument_replacement = {
            'False': function () {return false;},
            'True': function () {return true;},
            'None': function () {return null;},
            'context': function (i) { return {};
                context_index = i;
                var ctx = new openerp.web.CompoundContext(self.dataset.get_context(), widget.build_context() ? widget.build_context() : {});
                return ctx;
            }
        };
        var parent_fields = null, context_index = null;
        var parse_onchange_param = function (a, i) {
            var field = _.str.trim(a);

            // literal constant or context
            if (field in argument_replacement) {
                return argument_replacement[field](i);
            }
            // literal number
            if (/^-?\d+(\.\d+)?$/.test(field)) {
                return Number(field);
            }
            // form field
            if (self.fields[field]) {
                var value = self.fields[field].get_value();
                return value == null ? false : value;
            }
            // parent field
            var splitted = field.split('.');
            if (splitted.length > 1 && _.str.trim(splitted[0]) === "parent" && self.dataset.parent_view) {
                if (parent_fields === null) {
                    parent_fields = self.dataset.parent_view.get_fields_values([self.dataset.child_name]);
                }
                var p_val = parent_fields[_.str.trim(splitted[1])];
                if (p_val !== undefined) {
                    return p_val == null ? false : p_val;
                }
            }
            // string literal
            var first_char = field[0], last_char = field[field.length-1];
            if ((first_char === '"' && last_char === '"')
                || (first_char === "'" && last_char === "'")) {
                return field.slice(1, -1);
            }

            // v6.0 API: raw python dict value
            // (simple {'key': value})
            // TODO: improve this to handler some more complex cases.
            if (first_char === '{' && last_char === '}' && self.session.api == '6.0') {
                var value = {};
                var items = field.slice(1, -1).split(',');
                for (var j = 0; j < items.length; j++) {
                    var itemsplitted = items[j].split(':');
                    var key = _.str.trim(itemsplitted[0]);
                    var val = _.str.trim(itemsplitted[1]);

                    // key: check if litteral or parse_onchange_param
                    var key_first_char = key[0], key_last_char = key[key.length-1];
                    if ((key_first_char === '"' && key_last_char === '"')
                        || (key_first_char === "'" && key_last_char === "'")) {
                        key = key.slice(1, -1);
                    } else {
                        // currently 'key' must be a litteral, if that not the case
                        // considerer that parsing failed
                        throw new Error("Could not get field with name '" + field +
                                        "' for onchnage '" + onchange + "'");
                    }
                    val = parse_onchange_param(val, i);
                    value[key] = val;
                }
                return value;
            }

            throw new Error("Could not get field with name '" + field +
                            "' for onchange '" + onchange + "'");
        };
        var args = _.map(call[2].split(','), parse_onchange_param);

        return {
            method: method,
            args: args,
            context_index: context_index
        };
    },
    do_onchange: function(widget, processed) {
        var self = this;
        return this.on_change_mutex.exec(function() {
            try {
                var response = {}, can_process_onchange = $.Deferred();
                processed = processed || [];
                processed.push(widget.name);
                var on_change = widget.attrs.on_change;
                if (on_change) {
                    var change_spec = self.parse_on_change(on_change, widget);
                    if (change_spec) {
                        var ajax = {
                            url: '/web/dataset/onchange',
                            async: false
                        };
                        can_process_onchange = self.rpc(ajax, {
                            model: self.dataset.model,
                            method: change_spec.method,
                            args: [[]].concat(change_spec.args),
                            context_id: change_spec.context_index == undefined ? null : change_spec.context_index + 1
                        }).then(function(r) {
                            _.extend(response, r);
                        });
                    } else {
                        console.warn("Wrong on_change format", on_change);
                    }
                }
                // fail if onchange failed
                if (can_process_onchange.isRejected()) {
                    return can_process_onchange;
                }

                if (can_process_onchange.isRejected()) {
                    return can_process_onchange;
                }

                return self.on_processed_onchange(response, processed);
            } catch(e) {
                console.error(e);
                return $.Deferred().reject();
            }
        });
    },
    on_processed_onchange: function(response, processed) {
        try {
        var result = response;
        if (result.value) {
            for (var f in result.value) {
                if (!result.value.hasOwnProperty(f)) { continue; }
                var field = this.fields[f];
                // If field is not defined in the view, just ignore it
                if (field) {
                    var value = result.value[f];
                    if (field.get_value() != value) {
                        field.set_value(value);
                        if (!_.contains(processed, field.name)) {
                            this.do_onchange(field, processed);
                        }
                    }
                }
            }
        }
        if (!_.isEmpty(result.warning)) {
            $(QWeb.render("CrashManagerWarning", result.warning)).dialog({
                modal: true,
                buttons: [
                    {text: _t("Ok"), click: function() { $(this).dialog("close"); }}
                ]
            });
        }
        if (result.domain) {
            function edit_domain(node) {
                var new_domain = result.domain[node.attrs.name];
                if (new_domain) {
                    node.attrs.domain = new_domain;
                }
                _(node.children).each(edit_domain);
            }
            edit_domain(this.fields_view.arch);
        }
        return $.Deferred().resolve();
        } catch(e) {
            console.error(e);
            return $.Deferred().reject();
        }
    },
});
openerp.web.search.SelectionField = openerp.web.search.SelectionField.extend({
    set_value: function(value) {
        self = this
        value = value === null ? [[]] : value;
        self.$element.find('option').remove();
        var newselect = []
        var i=0;
        _.each(value, function(v) {
            newselect.push([v[0]||false, v[1]?String(v[1]):''])
            $('<option>', {'value': i})
                .text(v[1]?String(v[1]):'')
                .appendTo(self.$element);
            i++;
        });
        self.attrs.selection = newselect;
    }
})

openerp.web.form.FieldSelection = openerp.web.form.FieldSelection.extend({
/*    init: function(view, node) {
        self = this;
        if (node.attrs.get_selection && view.dataset.ids) {
            node.attrs.selection = this.synchronized_mode('/web/dataset/call', {
                model: view.dataset.model,
                method: node.attrs.get_selection,
                args: [view.dataset.ids[0], node.attrs.name]
            }, function(result) {
                node.attrs.selection = result;
                console.log(node.attrs.selection);
                self._super.apply(self, view, node);
            });
        } else {
            this._super.apply(this, arguments);
        }
    },*/
    set_value: function(value) {
        if (value instanceof Array && value[0] instanceof Array) {
            this.$element.find('option').remove();
            self = this
            _.each(value, function(v) {
                $('<option>', {'value': v[0]})
                .text(v[1]?String(v[1]):'')
                .appendTo(self.$element.find('select')[0]);
            });
            this._super(false);
            return;
        }
        this._super.apply(this, arguments);
    },
})
openerp.web.form.FieldMany2One = openerp.web.form.FieldMany2One.extend({
    init: function(view, node) {
        this._super.apply(this, arguments);
        if (node.attrs.limit) {
            this.limit = parseInt(node.attrs.limit, 10);
        }
    }
})
};
// vim:et fdc=0 fdl=0:
