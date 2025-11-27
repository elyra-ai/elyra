define([ // eslint-disable-line no-undef
    'jquery',
    'base/js/utils'
], ($, utils) => {
    function setupDOM() {
        $('#maintoolbar-container').append(
            $('<div>').attr('id', 'jupyter-resource-usage-display-disk')
                .addClass('btn-group')
                .addClass('jupyter-resource-usage-hide')
                .addClass('pull-right').append(
                    $('<strong>').text(' Disk: ')
                ).append(
                    $('<span>').attr('id', 'jupyter-resource-usage-disk')
                        .attr('title', 'Actively used CPU (updates every 5s)')
            )
        );
        $('#maintoolbar-container').append(
            $('<div>').attr('id', 'jupyter-resource-usage-display')
                .addClass('btn-group')
                .addClass('pull-right')
                .append(
                    $('<strong>').text('Memory: ')
                ).append(
                $('<span>').attr('id', 'jupyter-resource-usage-mem')
                    .attr('title', 'Actively used Memory (updates every 5s)')
            )
        );
        $('#maintoolbar-container').append(
            $('<div>').attr('id', 'jupyter-resource-usage-display-cpu')
                .addClass('btn-group')
                .addClass('jupyter-resource-usage-hide')
                .addClass('pull-right').append(
                    $('<strong>').text(' CPU: ')
                ).append(
                    $('<span>').attr('id', 'jupyter-resource-usage-cpu')
                        .attr('title', 'Actively used CPU (updates every 5s)')
            )
        );

        $('head').append(
            $('<style>').html(`
            .jupyter-resource-usage-warn { background-color: #FFD2D2; color: #D8000C; }
            .jupyter-resource-usage-hide { display: none; }
            #jupyter-resource-usage-display { padding: 2px 8px; }
            #jupyter-resource-usage-display-cpu { padding: 2px 8px; }
            #jupyter-resource-usage-display-disk { padding: 2px 8px; }
            `
        ));

    function humanFileSize(size) {
        var i = Math.floor(Math.log(size) / Math.log(1024));
        return (size / Math.pow(1024, i)).toFixed(1) * 1 + ' ' + ['B', 'kB', 'MB', 'GB', 'TB'][i];
    }

    var displayMetrics = function () {
        if (document.hidden) { // eslint-disable-line no-undef
            // Don't poll when nobody is looking
            return;
        }
        $.getJSON({
            url: utils.get_body_data('baseUrl') + 'api/metrics/v1',
            success: function (data) {
                let value = data['pss'] || data['rss'];
                let totalMemoryUsage = humanFileSize(value);

                var limits = data['limits'];
                var display = totalMemoryUsage;

                if (limits['memory']) {
                    var limit = limits['memory']['pss'] ?? limits['memory']['rss'];
                    if (limit) {
                        let maxMemoryUsage = humanFileSize(limit);
                        display += ' / ' + maxMemoryUsage
                    }
                    if (limits['memory']['warn']) {
                        $('#jupyter-resource-usage-display').addClass('jupyter-resource-usage-warn');
                    } else {
                        $('#jupyter-resource-usage-display').removeClass('jupyter-resource-usage-warn');
                    }
                }

                $('#jupyter-resource-usage-mem').text(display);

                // Handle CPU display
                var cpuPercent = data['cpu_percent'];
                if (cpuPercent !== undefined) {
                    // Remove hide CSS class if the metrics API gives us a CPU percent to display
                    $('#jupyter-resource-usage-display-cpu').removeClass('jupyter-resource-usage-hide');
                    display = '';
                    var maxCpu = data['cpu_count'];
                    limits = data['limits'];
                    // Display CPU usage as "{percent}% ({usedCpu} / {maxCPU})" e.g. "123% (1 / 8)"
                    var percentString = parseFloat(cpuPercent).toFixed(0);
                    var usedCpu = Math.round(parseFloat(cpuPercent) / 100).toString();
                    display = `${percentString}% (${usedCpu} / ${maxCpu})`;
                    // Handle limit warning
                    if (limits['cpu']) {
                        if (limits['cpu']['warn']) {
                            $('#jupyter-resource-usage-display-cpu').addClass('jupyter-resource-usage-warn');
                        } else {
                            $('#jupyter-resource-usage-display-cpu').removeClass('jupyter-resource-usage-warn');
                        }
                    }
    
                    $('#jupyter-resource-usage-cpu').text(display);    
                }

                // Handle Disk display
                var maxDisk = data['disk_total'];
                if (maxDisk !== undefined) {
                    // Remove hide CSS class if the metrics API gives us a CPU percent to display
                    $('#jupyter-resource-usage-display-disk').removeClass('jupyter-resource-usage-hide');
                    display = '';
                    var currentDisk = data['disk_used'];
                    display = humanFileSize(maxDisk) + ' / ' + humanFileSize(currentDisk);
                    // Handle limit warning
                    if (limits['disk']) {
                        if (limits['disk']['warn']) {
                            $('#jupyter-resource-usage-display-disk').addClass('jupyter-resource-usage-warn');
                        } else {
                            $('#jupyter-resource-usage-display-disk').removeClass('jupyter-resource-usage-warn');
                        }
                    }
    
                    $('#jupyter-resource-usage-disk').text(display);    
                }
            }
        });
    };

    var load_ipython_extension = function () {
        setupDOM();
        displayMetrics();
        // Update every five seconds, eh?
        setInterval(displayMetrics, 1000 * 5); // eslint-disable-line no-undef

        // eslint-disable-next-line no-undef
        document.addEventListener('visibilitychange', () => {
            // Update instantly when user activates notebook tab
            // FIXME: Turn off update timer completely when tab not in focus
            if (!document.hidden) { // eslint-disable-line no-undef
                displayMetrics();
            }
        }, false);
    };

    return {
        load_ipython_extension: load_ipython_extension,
    };
}});
