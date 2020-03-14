# Configuration file for jupyter-notebook.

## Allow requests where the Host header doesn't point to a local server
#
#  By default, requests get a 403 forbidden response if the 'Host' header shows
#  that the browser thinks it's on a non-local domain. Setting this option to
#  True disables this check.
#
#  This protects against 'DNS rebinding' attacks, where a remote web server
#  serves you a page and then changes its DNS to send later requests to a local
#  IP, bypassing same-origin checks.
#
#  Local IP addresses (such as 127.0.0.1 and ::1) are allowed as local, along
#  with hostnames configured in local_hostnames.
c.NotebookApp.allow_remote_access = True

## The default URL to redirect to from `/`
c.NotebookApp.default_url = '/lab'

## The directory to use for notebooks and kernels.
c.NotebookApp.notebook_dir = '/tmp/workspace'
