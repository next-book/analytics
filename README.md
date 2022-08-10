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

