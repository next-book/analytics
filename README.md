# analytics

Self-hosted event tracking analytics for web books. Based on [plausible/analytics](https://github.com/plausible/analytics) and GA measurement protocols.

## Client usage 

```
import Tracker from '@next-book/analytics'

Tracker.init('book-identifier', 'book domain/address')

Tracker.send('pageview')
Tracker.send({name: 'font-size-changed', category: 'ui', method: 'slider', value: '1'})
```

## Development 

- install [Nix, the package manager](https://nixos.org/download.html)
- run `nix-shell` to get development environment with node and running postgress instance

## Production info 

- 1 vCPU, 1GB / 25GB Disk
- node 18, postgres 14
- avg. event row takes 210 b ~> 80 M events fit into DB, 4 M events fit into RAM   
- api can collect 630 events/sec (avg. time 80 ms), see [load test](load-test.txt).
