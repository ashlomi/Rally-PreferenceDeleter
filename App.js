Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',

    items: [
        {
            xtype: 'container',
            itemId: 'preferenceNameContainer',
            padding: '10',
            layout: {
                type: 'vbox'
            },
            flex: 1
        },
        {
            xtype: 'container',
            itemId: 'filterValueContainer',
            padding: '10'
        }
    ],

    _workspaceObjectID: null,
    _workspaceRef: null,

    _typeFeature: null,
    _typeInitiative: null,

    _filterNameTextbox: null,
    _findPreferenceButton: null,
    _deletePreferenceButton: null,

    _preferencesStore: null,
    _foundPrefRecord: null,

    launch: function() {
        var me = this;
        var currentContext = Rally.environment.getContext();

        //Get the current user and workspace
        me._user = currentContext.getUser();
        me._workspaceObjectID = currentContext.getWorkspace().ObjectID;
        me._workspaceRef = "/workspace/" + me._workspaceObjectID;

        // console.log(me._workspaceObjectID);

        this._buildUI(this);
    },

    _buildUI: function(me) {

        me._filterNameTextbox = Ext.create('Rally.ui.TextField', {
            fieldLabel: 'Preference Name:',
            width: 400
        });
        me.down('#preferenceNameContainer').add(me._filterNameTextbox);

        me._findPreferenceButton = Ext.create('Rally.ui.Button', {
            text: "Find Preference",
            handler: function() {
                me._queryFilterPref();
            }
        });
        me.down('#preferenceNameContainer').add(me._findPreferenceButton);
    },

    _queryFilterPref: function() {

        var me = this;
        me._filterSearchString = me._filterNameTextbox.getValue();

        me._preferencesStore = Ext.create('Rally.data.wsapi.Store', {
            model: 'Preference',
            autoLoad: true,
            fetch: true,
            listeners: {
                scope: this,
                load: me._preferenceStoreLoaded
            },
            filters: [
                {
                    property: 'Name',
                    operator: '=',
                    value: me._filterSearchString
                }
            ]
        });
    },

    _deletePreference: function(preferenceModel, scope) {

        var me = scope;
        preferenceModel.destroy({
            callback: function(result, operation) {
                if(operation.wasSuccessful()) {

                    // Notify of successful deletion
                    Ext.create('Rally.ui.dialog.ConfirmDialog', {
                        title: "Preference Deleted",
                        message: "Preference Successfully Removed!",
                        confirmLabel: "Ok"
                    });
                } else {
                    Ext.create('Rally.ui.dialog.ConfirmDialog', {
                        title: "Preference Not Removed",
                        message: "Error Deleting Preference!",
                        confirmLabel: "Ok",
                        listeners: {
                            confirm: function () {
                                return;
                            }
                        }
                    });
                }
            }
        });

    },

    _deletePreferenceHandler: function(record, scope) {

        var me = scope;

        var recordObjectID = record.get('ObjectID');

        var preferenceModel = Rally.data.ModelFactory.getModel({
            type: 'Preference',
            scope: this,
            success: function(model, operation) {
                model.load(recordObjectID, {
                    scope: this,
                    success: function(model, operation) {

                        var confirmLabel = "Delete Preference Permanently";
                        var message = "Really Delete Preference?";

                        Ext.create('Rally.ui.dialog.ConfirmDialog', {
                            message: message,
                            confirmLabel: confirmLabel,
                            listeners: {
                                confirm: function(){
                                    me._deletePreference(model, me);
                                }
                            }
                        });
                    }
                });
            }
        });

    },

    _preferenceStoreLoaded: function(store, records) {

        var me = this;

        if (records.length === 0) {
            Ext.Msg.alert('Preference Not Found', me._filterSearchString);
        }
;
        Ext.Array.each(records, function(record) {

            var prefWorkspace = record.get('Workspace');
            var prefWorkspaceRef = prefWorkspace._ref;

            if (prefWorkspaceRef === me._workspaceRef) {
                me._foundPrefRecord = record;
                me._filterValue = record.get('Value');
                var preferenceName = record.get('Name');
                Ext.Msg.alert('Preference Found: ' + preferenceName, me._filterValue);
                // console.log(me._foundPrefRecord);

                if (me._deletePreferenceButton) {
                    Ext.destroy(me._deletePreferenceButton);
                }

                me._deletePreferenceButton = Ext.create('Rally.ui.Button', {
                    text: "Delete Preference",
                    handler: function() {
                        me._deletePreferenceHandler(record, me);
                    }
                });

                me.down('#filterValueContainer').add(me._deletePreferenceButton);

            }
        });
    }
});