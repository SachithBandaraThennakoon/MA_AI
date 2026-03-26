def analyze_movement(required_parts, live_angles):
    analysis = []

    for part in required_parts:
        body = part.body_part
        min_a = part.min_angle
        max_a = part.max_angle

        value = live_angles.get(body)

        if value is None:
            continue

        if value < min_a:
            analysis.append({
                "body_part": body,
                "issue": "too_low",
                "value": value,
                "target": (min_a, max_a)
            })

        elif value > max_a:
            analysis.append({
                "body_part": body,
                "issue": "too_high",
                "value": value,
                "target": (min_a, max_a)
            })

        else:
            analysis.append({
                "body_part": body,
                "issue": "good",
                "value": value,
                "target": (min_a, max_a)
            })

    return analysis