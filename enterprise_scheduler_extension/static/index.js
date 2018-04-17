define([
    'base/js/namespace',
    'jquery',
    'base/js/utils',
    'base/js/dialog'
], function(Jupyter, $, utils, dialog) {

    function getCookie(name) {
        var cookieValue = null;
        if (document.cookie && document.cookie != '') {
            var cookies = document.cookie.split(';');
            for (var i = 0; i < cookies.length; i++) {
                var cookie = jQuery.trim(cookies[i]);
                // Does this cookie string begin with the name we want?
                if (cookie.substring(0, name.length + 1) == (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    function csrfSafeMethod(method) {
        // these HTTP methods do not require CSRF protection
        return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
    }

    function submit_notebok_to_scheduler() {
        console.log(Jupyter.notebook.toJSON())

        var csrftoken = getCookie('_xsrf');
        console.log(csrftoken);

        var schedulerUrl = utils.url_path_join(utils.get_body_data('baseUrl'), 'scheduler')
        console.log(schedulerUrl)

        $.ajaxSetup({
            crossDomain: false, // obviates need for sameOrigin test
            beforeSend: function(xhr, settings) {
                if (!csrfSafeMethod(settings.type)) {
                    xhr.setRequestHeader("X-CSRFToken", csrftoken);
                }
            }
        });

        $.ajax({
            type: "POST",
            url: "/scheduler",
            // The key needs to match your method's input parameter (case-sensitive).
            data: JSON.stringify(Jupyter.notebook.toJSON()),
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function(data){
                console.log('Inside ui extension callback')
                console.log("Data: ", data)
                dialog.modal(data)
            },
            failure: function(errMsg) {
                console.log('Inside ui extension error callback')
                console.log("Error: ", errMsg)
                dialog.modal(errMsg)
            }
        });
    }

    function place_button() {
	if (!Jupyter.toolbar) {
	    $([Jupyter.events]).on("app_initialized.NotebookApp", place_button);
	    return;
	}

	Jupyter.toolbar.add_buttons_group([{
	    label: 'Submit notebook...',
	    icon: 'fa-send',
	    callback: submit_notebok_to_scheduler,
        id: 'submit-notebook-to-scheduler-button'
	}])
    }

    function load_ipython_extension() {
	    place_button();
    }

    return {
	    load_ipython_extension: load_ipython_extension
    };

});
