from typing import List, Dict, Any

class SpatialRequestClusterer:
    def __init__(self, spatial_buffer_km: float = 2.0):
        self.buffer_km = spatial_buffer_km

    def find_bundling_candidates(self, requests: List[Dict[str, Any]]) -> List[List[Dict[str, Any]]]:
        """
        Groups co-located requests from different departments into potential Super-Blocks.
        Two requests are candidates if they are on the same section/directional track,
        within buffer_km distance, and belong to different departments (TMS/SMMS/TDMS).
        """
        clusters = []
        visited = set()

        for i, req1 in enumerate(requests):
            if i in visited:
                continue
            current_cluster = [req1]
            visited.add(i)

            for j, req2 in enumerate(requests):
                if j in visited:
                    continue

                same_direction = req1.get("track_direction") == req2.get("track_direction")
                same_section = req1.get("section_id") == req2.get("section_id")

                # Check spatial overlap within buffer distance
                dist_overlap = (
                    abs(req1.get("from_km", 0) - req2.get("from_km", 0)) <= self.buffer_km or
                    abs(req1.get("to_km", 0) - req2.get("to_km", 0)) <= self.buffer_km
                )

                diff_dept = req1.get("department") != req2.get("department")

                if (same_section or same_direction) and dist_overlap and diff_dept:
                    current_cluster.append(req2)
                    visited.add(j)

            clusters.append(current_cluster)
        return clusters
