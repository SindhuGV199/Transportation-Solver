# Graph Report - .  (2026-06-27)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 124 nodes · 155 edges · 15 communities (11 shown, 4 thin omitted)
- Extraction: 92% EXTRACTED · 8% INFERRED · 0% AMBIGUOUS · INFERRED: 12 edges (avg confidence: 0.79)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1ea714ca`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]

## God Nodes (most connected - your core abstractions)
1. `TransportationRequest` - 16 edges
2. `TransportationService` - 11 edges
3. `TransportationResponse` - 9 edges
4. `TransportationController` - 7 edges
5. `scripts` - 5 edges
6. `React` - 4 edges
7. `TransportationModelApplication` - 3 edges
8. `TransportationModelApplicationTests` - 3 edges
9. `Vite` - 3 edges
10. `@vitejs/plugin-react` - 3 edges

## Surprising Connections (you probably didn't know these)
- `TransportationController` --references--> `TransportationService`  [EXTRACTED]
  transportationmodel_backend/src/main/java/com/project/transportation_model/controller/TransportationController.java → transportationmodel_backend/src/main/java/com/project/transportation_model/service/TransportationService.java

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Frontend Technology Stack** — react, vite, eslint, vitejs_plugin_react, vitejs_plugin_react_swc, typescript [INFERRED 0.75]
- **Backend Spring Ecosystem** — apache_maven, spring_boot_maven_plugin, spring_web, spring_boot_devtools, spring_mvc, spring_rest_services [INFERRED 0.75]
- **Frontend Visual Assets** — favicon_svg, icons_svg, react_svg, vite_svg, hero_png [INFERRED 0.75]

## Communities (15 total, 4 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.09
Nodes (22): ESLint, Hot Module Replacement (HMR), Oxc, React Compiler, React Logo, SWC, devDependencies, eslint (+14 more)

### Community 1 - "Community 1"
Cohesion: 0.16
Nodes (3): TransportationRequest, PostMapping, String

### Community 2 - "Community 2"
Cohesion: 0.20
Nodes (8): React, App(), dependencies, axios, bootstrap, lucide-react, react, react-dom

### Community 3 - "Community 3"
Cohesion: 0.18
Nodes (10): Apache Maven, Maven Parent POM, OCI Image, RESTful Web Service, Spring Boot DevTools, Spring Boot Maven Plugin, Spring MVC, Spring REST Services (+2 more)

### Community 4 - "Community 4"
Cohesion: 0.29
Nodes (4): Double, Object, Service, TransportationService

### Community 5 - "Community 5"
Cohesion: 0.20
Nodes (9): name, private, scripts, build, dev, lint, preview, type (+1 more)

### Community 7 - "Community 7"
Cohesion: 0.29
Nodes (6): Bluesky Icon, Discord Icon, Documentation Icon, GitHub Icon, Social Icon, X Icon

### Community 8 - "Community 8"
Cohesion: 0.33
Nodes (5): TransportationController, CrossOrigin, GetMapping, RequestMapping, RestController

### Community 9 - "Community 9"
Cohesion: 0.40
Nodes (4): dependencies, axios, bootstrap, lucide-react

### Community 10 - "Community 10"
Cohesion: 0.60
Nodes (3): SpringBootTest, Test, TransportationModelApplicationTests

## Knowledge Gaps
- **45 isolated node(s):** `axios`, `bootstrap`, `lucide-react`, `name`, `private` (+40 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `devDependencies` connect `Community 0` to `Community 5`?**
  _High betweenness centrality (0.058) - this node is a cross-community bridge._
- **Why does `TransportationRequest` connect `Community 1` to `Community 6`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **Why does `React` connect `Community 2` to `Community 0`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
- **What connects `axios`, `bootstrap`, `lucide-react` to the rest of the system?**
  _45 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.09057971014492754 - nodes in this community are weakly interconnected._