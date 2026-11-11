"""Status check for a single Luma event page read (researcher.2). Run only on a page a person has asked to be read (the Luma hold, work/49).
Both directions count as a change: a page that NEWLY says cancelled/postponed/online, and a page that STOPS saying it (AltaIR Capital, 11 Nov 2026).
usage: python3 -I seed/status-check.py <stored-status> <page-title> <page-description-file>"""
import re, sys
NOTICE = re.compile(r"(?i)(cancel|postpon|will not take place|rescheduled|moved (online|to)|state of alert|red (wind )?(alert|warning)|due to (the )?(storm|weather))")
def check(stored_status, title, desc):
    text = f"{title} {desc}"
    says = bool(NOTICE.search(text))
    expects = stored_status in ("cancelled", "moved", "online")
    if says and not expects: return "CHANGED: the page now carries a notice; stored status is " + stored_status
    if expects and not says: return "CHANGED: the page no longer carries the notice; stored status is " + stored_status + " (set unknown/evidence until confirmed)"
    return "same"
if __name__ == "__main__":
    print(check(sys.argv[1], sys.argv[2], open(sys.argv[3]).read()))
