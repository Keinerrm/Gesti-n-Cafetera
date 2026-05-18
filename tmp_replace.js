const fs = require('fs');
const path = require('path');
const dir = 'c:\\Users\\keine\\OneDrive\\Desktop\\Gestion Cafetera\\js';

function walk(d) {
    fs.readdirSync(d).forEach(f => {
        let p = path.join(d, f);
        if (fs.statSync(p).isDirectory()) walk(p);
        else if (p.endsWith('.js')) {
            let c = fs.readFileSync(p, 'utf8');
            if (c.includes('getAllByFinca')) {
                fs.writeFileSync(p, c.replace(/getAllByFinca/g, 'getByFinca'));
                console.log('Fixed', p);
            }
        }
    });
}
walk(dir);
