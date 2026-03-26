def analyze_movement(angles, targets):
    results = []

    for part in targets:
        name = part["body_part"]
        value = angles.get(name)

        if value is None:
            continue

        min_val = part["min"]
        max_val = part["max"]

        if value < min_val:
            status = "low"
        elif value > max_val:
            status = "high"
        else:
            status = "good"

        results.append({
            "body_part": name,
            "value": value,
            "min": min_val,
            "max": max_val,
            "status": status
        })

    return results