define([
    'base/js/namespace',
    'jquery',
    'base/js/utils',
    'base/js/dialog'
], function(Jupyter, $, utils, dialog) {

    function get_schedule_req() {
        console.log(Jupyter.notebook.toJSON())

        console.log("Submitting notebook to scheduler...")
        var schedulerUrl = utils.url_path_join(utils.get_body_data('baseUrl'), 'scheduler')
        console.log("Scheduler url: ", schedulerUrl)
        $.getJSON(schedulerUrl, function(data) {
            console.log('Inside ui extension callback')
            console.log("Data: ", data)
            dialog.modal(data)
        })
    }

    function place_button() {
	if (!Jupyter.toolbar) {
	    $([Jupyter.events]).on("app_initialized.NotebookApp", place_button);
	    return;
	}

	Jupyter.toolbar.add_buttons_group([{
	    label: 'Submit notebook...',
	    icon: 'fa-send',
	    callback: get_schedule_req,
        id: 'submit-to-scheduler-button'
	}])
    }

    function load_ipython_extension() {
	    place_button();
    }

    return {
	    load_ipython_extension: load_ipython_extension
    };

});
