# The redirect for fringe.promptugal.news (work/30)

A repository's GitHub Pages serves one custom domain. When PrompTugal__News__Fringe moves to lisbontechfringe.com, the old host
fringe.promptugal.news stops answering. To keep every link already shared (including `?via=` tags) working:

1. Make a tiny repository in the PrompTugal organisation (say `PrompTugal__Fringe__Redirect`) holding `index.html`, `404.html`
   (both in this folder) and a `CNAME` file containing `fringe.promptugal.news`. Pages on, branch `main`, folder `/`.
2. The DNS for fringe.promptugal.news does not change (it already points at GitHub Pages).
3. `404.html` is served for every path, so `https://fringe.promptugal.news/e/<id>/?via=x` lands on
   `https://lisbontechfringe.com/e/<id>/?via=x`: path, query and hash are kept by the script. Static pages cannot send a real 301,
   so search engines see a redirect page (noindex); that is fine for shared links.

Switch order: set up this repository only after the main repository's custom domain has been changed (the host is then free).
