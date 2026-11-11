# The board: one file per piece of work

Each item is `work/NN-<slug>.md` with this front matter:

```
---
id: NN
title: <what>
owner: <conductor, or empty>
status: open | claimed | done
lane: <from SWARM.md>
needs: <what it depends on>
done-means: <how anyone can check it>
evidence: <links or commits, when done>
---
```

To claim an item, set `owner:` and `status: claimed` in a commit. When it's finished, set `status: done` and fill in `evidence:`. See SWARM.md.

**Numbers:** pull first, then take the next number after the highest in `ls work/`. If two items clash anyway, the later commit renumbers its own item (the lead checks at each wake).
