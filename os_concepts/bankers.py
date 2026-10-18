"""Banker's algorithm — safe-state check for panel/resource allocation."""


def is_safe(available, max_need, allocation):
    n = len(max_need)
    m = len(available)
    need = [[max_need[i][j] - allocation[i][j] for j in range(m)]
            for i in range(n)]
    work, finish, seq = list(available), [False] * n, []

    while len(seq) < n:
        progressed = False
        for i in range(n):
            if not finish[i] and all(need[i][j] <= work[j] for j in range(m)):
                for j in range(m):
                    work[j] += allocation[i][j]
                finish[i] = True
                seq.append(i)
                progressed = True
                break
        if not progressed:
            break

    return {
        "safe": all(finish),
        "sequence": seq,
        "remaining": work,
        "unfinishable": [i for i, f in enumerate(finish) if not f],
    }