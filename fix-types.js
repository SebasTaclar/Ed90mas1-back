const fs = require('fs');

// Fix MatchPrismaAdapter
let matchAdapter = fs.readFileSync('c:/InfoSebas/dev/Ed90mas1-back/src/infrastructure/DbAdapters/MatchPrismaAdapter.ts', 'utf8');

// Replace single match returns
matchAdapter = matchAdapter.replace(/return match;$/gm, 'return this.convertMatchToDomain(match);');
matchAdapter = matchAdapter.replace(/return updatedMatch;$/gm, 'return this.convertMatchToDomain(updatedMatch);');

// Replace array returns that need conversion
matchAdapter = matchAdapter.replace(/return matches;$/gm, 'return matches.map(m => this.convertMatchWithRelationsToDomain(m));');

// Fix specific places where matches.push(match) happens
matchAdapter = matchAdapter.replace(/matches\.push\(match\);/g, 'matches.push(this.convertMatchWithRelationsToDomain(match));');

fs.writeFileSync('c:/InfoSebas/dev/Ed90mas1-back/src/infrastructure/DbAdapters/MatchPrismaAdapter.ts', matchAdapter);

// Fix MatchEventPrismaAdapter  
let eventAdapter = fs.readFileSync('c:/InfoSebas/dev/Ed90mas1-back/src/infrastructure/DbAdapters/MatchEventPrismaAdapter.ts', 'utf8');

// Replace single event returns
eventAdapter = eventAdapter.replace(/return event;$/gm, 'return this.convertEventToDomain(event);');
eventAdapter = eventAdapter.replace(/return updatedEvent;$/gm, 'return this.convertEventToDomain(updatedEvent);');

// Replace array returns that need conversion  
eventAdapter = eventAdapter.replace(/return events;$/gm, 'return events.map(e => this.convertEventWithRelationsToDomain(e));');

fs.writeFileSync('c:/InfoSebas/dev/Ed90mas1-back/src/infrastructure/DbAdapters/MatchEventPrismaAdapter.ts', eventAdapter);

console.log('Fixed type conversions in both adapters');
