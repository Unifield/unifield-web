
openerp.share_v60 = function(session) {

function launch_wizard_v60(self, view) {
        var action_manager = new session.web.ActionManager(self);
        var action = view.widget_parent.action;
        var Share = new session.web.DataSet(self, 'share.wizard', view.dataset.get_context());
        var domain = new session.web.CompoundDomain(view.dataset.domain);
        if (view.fields_view.type == 'form') {
            domain = new session.web.CompoundDomain(domain, [['id', '=', view.datarecord.id]]);
        }

        self.rpc('/web/session/eval_domain_and_context', {
            domains: [domain],
            contexts: [view.dataset.context]
        }, function (result) {
            self.rpc('/web/share_v60/wizard', {
                domain: result.domain,
                action_id: action.id
            }, function(result) {
                var share_id = result.result;
                var step1 = Share.call('go_step_1', [[share_id], result.context], function(result) {
                    var action = result;
                    action_manager.do_action(action);
                });
            });
        });
}

function has_share(yes, no) {
    if (!session.connection.share_flag) {
        session.connection.share_flag = $.Deferred(function() {
            session.connection.rpc('/web/share_v60/has_share', {}).pipe(function (res) {
                if (res) {
                    session.connection.share_flag.resolve();
                } else {
                    session.connection.share_flag.reject();
                }
            });
        });
    }
    session.connection.share_flag.done(yes).fail(no);
}

session.web.Sidebar = session.web.Sidebar.extend({
    add_default_sections: function() {
        this._super();
        var self = this;
        if (self.session.api == '6.0') {
            has_share(function() {
                var _t = session.web._t;
                self.add_items('other', [{
                    label: _t('Share'),
                    callback: self.on_sidebar_click_share_v60,
                    classname: 'oe-share_v60'
                }]);
            });
        }
    },
    on_sidebar_click_share_v60: function(item) {
        var view = this.widget_parent
        launch_wizard_v60(this, view);
    },
});

session.web.ViewManagerAction.include({
    start: function() {
        var self = this;
        if (self.session.api == '6.0') {
            has_share(function() {
                self.$element.find('a.oe-share_v60').click(self.on_click_share_v60);
            }, function() {
                self.$element.find('a.oe-share_v60').remove();
            });
        } else {
            self.$element.find('a.oe-share_v60').remove();
        }
        return this._super.apply(this, arguments);
    },
    on_click_share_v60: function(e) {
        e.preventDefault();
        launch_wizard_v60(this, this.views[this.active_view].controller);
    },
});

};

