"""Page replacement simulations (FIFO, LRU, Optimal)
applied to opportunity-view cache traces."""


def simulate(frames, refs, policy):
    frames = int(frames)
    refs = list(refs)
    mem, timeline = [], []
    hits = misses = 0
    upper = policy.upper()

    for i, page in enumerate(refs):
        if page in mem:
            hits += 1
            if upper == "LRU":
                mem.remove(page)
                mem.append(page)
            hit = True
        else:
            misses += 1
            if len(mem) >= frames:
                if upper == "FIFO":
                    mem.pop(0)
                elif upper == "LRU":
                    mem.pop(0)
                elif upper == "OPT":
                    future = refs[i + 1:]
                    idx = {
                        p: (future.index(p) if p in future else float("inf"))
                        for p in mem
                    }
                    victim = max(idx, key=idx.get)
                    mem.remove(victim)
            mem.append(page)
            hit = False
        timeline.append({
            "step": i + 1, "page": page,
            "frames": list(mem), "hit": hit,
        })

    return {
        "policy": upper, "frames": frames, "refs": refs,
        "timeline": timeline, "hits": hits, "misses": misses,
        "hit_ratio": round(hits / (hits + misses), 3) if (hits + misses) else 0.0,
    }