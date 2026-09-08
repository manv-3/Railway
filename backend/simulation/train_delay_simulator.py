from typing import List, Dict, Any

class TrainDispatchSimulator:
    """
    Simulates dynamic train holding at station loop lines and calculates
    cascading delays when a maintenance block occupies a section (PS 26028 Synergy).
    """
    def __init__(self):
        pass

    def simulate_impact(self, block: Dict[str, Any], trains: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        impacts = []
        b_start = int(block.get("start_minute", 0))
        b_end = int(block.get("end_minute", 120))
        b_sec = block.get("section_id")

        for tr in trains:
            if tr.get("section_id") != b_sec:
                continue

            t_arr = int(tr.get("entry_minute", 0))
            t_dep = int(tr.get("exit_minute", 30))
            prio = int(tr.get("priority_precedence", 2)) # 1 = Vande Bharat/Rajdhani, 4 = Freight

            # Overlap check
            if max(b_start, t_arr) < min(b_end, t_dep):
                detention_minutes = max(10, (b_end - t_arr) + 12) # 12-min safety clearing buffer
                
                if prio == 1:
                    impact_type = "PRECEDENCE_PRIORITY_BYPASS"
                    detention_minutes = 0 # Cannot detain Rajdhani/Vande Bharat
                elif prio == 4:
                    impact_type = "HELD_AT_LOOP_LINE"
                else:
                    impact_type = "REGULATED_AT_JUNCTION"

                if detention_minutes > 0:
                    impacts.append({
                        "train_number": tr.get("train_number", "TR_UNKNOWN"),
                        "train_name": tr.get("train_name", "Express"),
                        "category": tr.get("train_category", "EXPRESS"),
                        "priority_precedence": prio,
                        "estimated_delay_minutes": detention_minutes,
                        "impact_type": impact_type,
                        "is_passenger": prio <= 3
                    })

        return impacts
