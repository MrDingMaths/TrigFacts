/**
 * TrigQuestionGenerator - Main dispatcher for generating trig questions
 */
class TrigQuestionGenerator {
    constructor() {
        this.initializeTrigData();
    }

    initializeTrigData() {
        this.TRIG_VALUES = [
            { deg: '0°', rad: '0', sin: '0', cos: '1', tan: '0', val: { sin: 0, cos: 1, tan: 0 } },
            { deg: '30°', rad: '\\frac{\\pi}{6}', sin: '\\frac{1}{2}', cos: '\\frac{\\sqrt{3}}{2}',
              tan: '\\frac{1}{\\sqrt{3}}', val: { sin: 0.5, cos: Math.sqrt(3)/2, tan: 1/Math.sqrt(3) } },
            { deg: '45°', rad: '\\frac{\\pi}{4}', sin: '\\frac{1}{\\sqrt{2}}', cos: '\\frac{1}{\\sqrt{2}}',
              tan: '1', val: { sin: 1/Math.sqrt(2), cos: 1/Math.sqrt(2), tan: 1 } },
            { deg: '60°', rad: '\\frac{\\pi}{3}', sin: '\\frac{\\sqrt{3}}{2}', cos: '\\frac{1}{2}',
              tan: '\\sqrt{3}', val: { sin: Math.sqrt(3)/2, cos: 0.5, tan: Math.sqrt(3) } },
            { deg: '90°', rad: '\\frac{\\pi}{2}', sin: '1', cos: '0', tan: 'undefined',
              val: { sin: 1, cos: 0, tan: Infinity } },
        ];

        this.ALL_VALUES = this.TRIG_VALUES.flatMap(v => [v.sin, v.cos, v.tan])
            .filter((v, i, a) => a.indexOf(v) === i && v !== 'undefined');

        this.CONVERSIONS = [
            { deg: '120°', rad: '\\frac{2\\pi}{3}' }, { deg: '135°', rad: '\\frac{3\\pi}{4}' },
            { deg: '150°', rad: '\\frac{5\\pi}{6}' }, { deg: '180°', rad: '\\pi' },
            { deg: '210°', rad: '\\frac{7\\pi}{6}' }, { deg: '225°', rad: '\\frac{5\\pi}{4}' },
            { deg: '240°', rad: '\\frac{4\\pi}{3}' }, { deg: '270°', rad: '\\frac{3\\pi}{2}' },
            { deg: '300°', rad: '\\frac{5\\pi}{3}' }, { deg: '315°', rad: '\\frac{7\\pi}{4}' },
            { deg: '330°', rad: '\\frac{11\\pi}{6}' }, { deg: '360°', rad: '2\\pi' }
        ];

        this.ALL_ANGLES = this.TRIG_VALUES.concat(this.CONVERSIONS);
        this.CAST_RULES = { sin: [1, 2], cos: [1, 4], tan: [1, 3] };
    }

    generate(level) {
        try {
            switch(level.type) {
                case 'exact': return this.generateExactValue(level);
                case 'quadrant': return this.generateQuadrantValue(level);
                case 'equivalent': return this.generateEquivalentRatio(level);
                case 'conversion': return this.generateConversion(level);
                case 'simplify_fractions': return this.generateSimplifyFractions(level);
                case 'reference_angles': return this.generateReferenceAngles(level);
                case 'reference_angles_rad': return this.generateReferenceAnglesRadians(level);
                default: throw new Error(`Unknown level type: ${level.type}`);
            }
        } catch (error) {
            console.error('Error generating question:', error);
            return {
                format: 'Error generating question',
                answer: 'error',
                options: ['error'],
                error: true
            };
        }
    }

    generateExactValue(level) {
        const func = this._getRandom(['sin', 'cos', 'tan']);
        const displayFunc = '\\' + func;
        const isDeg = level.unit === 'deg';

        let angle = this._getRandom(this.TRIG_VALUES);
        if (func === 'tan' && angle.tan === 'undefined') {
            angle = this._getRandom(this.TRIG_VALUES.filter(v => v.tan !== 'undefined'));
        }

        const angleText = isDeg ? angle.deg : angle.rad;
        const value = angle[func];

        const questionType = Math.random() < 0.5 ? 'find_value' : 'find_angle';

        if (questionType === 'find_value') {
            return {
                format: `${displayFunc}(${angleText}) = \\_\\_\\_`,
                answer: value,
                type: 'exact_value'
            };
        } else {
            return {
                format: `${displayFunc}(\\_\\_\\_) = ${value}`,
                answer: angleText,
                type: 'exact_angle'
            };
        }
    }

    generateSimplifyFractions(level) {
        const numerators = [30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330, 360];
        const numerator = this._getRandom(numerators);

        const gcd = this._gcd(numerator, 180);
        const simplifiedNum = numerator / gcd;
        const simplifiedDen = 180 / gcd;

        let answer;
        if (simplifiedDen === 1) {
            answer = simplifiedNum.toString();
        } else {
            answer = `\\frac{${simplifiedNum}}{${simplifiedDen}}`;
        }

        return {
            format: `\\frac{${numerator}}{180} = \\_\\_\\_`,
            answer: answer,
            type: 'simplify_fractions'
        };
    }

    generateReferenceAngles(level) {
        const referenceAngles = [30, 45, 60];
        const refAngle = this._getRandom(referenceAngles);

        const possibleAngles = [
            refAngle,
            180 - refAngle,
            180 + refAngle,
            360 - refAngle
        ];

        const angleOfInclination = this._getRandom(possibleAngles);
        const answer = `${refAngle}°`;

        return {
            format: `\\theta = ${angleOfInclination}°\n\nA = \\_\\_\\_`,
            answer: answer,
            type: 'reference_angles',
            angleDeg: angleOfInclination
        };
    }

    generateReferenceAnglesRadians(level) {
        // Reference angles in radians: π/6, π/4, π/3
        const referenceAngles = [
            { rad: '\\frac{\\pi}{6}', deg: 30 },
            { rad: '\\frac{\\pi}{4}', deg: 45 },
            { rad: '\\frac{\\pi}{3}', deg: 60 }
        ];
        const refAngleObj = this._getRandom(referenceAngles);
        const refAngleDeg = refAngleObj.deg;

        // Generate possible angles in radians
        const possibleAnglesDeg = [
            refAngleDeg,
            180 - refAngleDeg,
            180 + refAngleDeg,
            360 - refAngleDeg
        ];

        const angleOfInclinationDeg = this._getRandom(possibleAnglesDeg);

        // Find the radian equivalent
        const angleObj = this.ALL_ANGLES.find(a => parseInt(a.deg) === angleOfInclinationDeg);
        const angleOfInclinationRad = angleObj ? angleObj.rad : this._degToRad(angleOfInclinationDeg);

        const answer = refAngleObj.rad;

        return {
            format: `\\theta = ${angleOfInclinationRad}\n\nA = \\_\\_\\_`,
            answer: answer,
            type: 'reference_angles_rad',
            angleDeg: angleOfInclinationDeg
        };
    }

    _degToRad(deg) {
        // Helper to convert degrees to radian format
        const num = deg * Math.PI / 180;
        const pi = Math.PI;
        const tolerance = 0.0001;

        // Check common fractions
        const fractions = [
            { num: 1, den: 6, deg: 30 },
            { num: 1, den: 4, deg: 45 },
            { num: 1, den: 3, deg: 60 },
            { num: 2, den: 3, deg: 120 },
            { num: 3, den: 4, deg: 135 },
            { num: 5, den: 6, deg: 150 },
            { num: 1, den: 1, deg: 180 },
            { num: 7, den: 6, deg: 210 },
            { num: 5, den: 4, deg: 225 },
            { num: 4, den: 3, deg: 240 },
            { num: 3, den: 2, deg: 270 },
            { num: 5, den: 3, deg: 300 },
            { num: 7, den: 4, deg: 315 },
            { num: 11, den: 6, deg: 330 },
            { num: 2, den: 1, deg: 360 }
        ];

        for (let f of fractions) {
            if (Math.abs(deg - f.deg) < tolerance) {
                if (f.num === 1 && f.den === 1) return '\\pi';
                if (f.num === 2 && f.den === 1) return '2\\pi';
                return `\\frac{${f.num}\\pi}{${f.den}}`;
            }
        }

        return '\\pi'; // fallback
    }

    _gcd(a, b) {
        return b === 0 ? a : this._gcd(b, a % b);
    }

    generateQuadrantValue(level) {
        const refAngleObj = this._getRandom(
            this.TRIG_VALUES.filter(a => parseInt(a.deg) > 0 && parseInt(a.deg) < 90)
        );
        const quadrant = this._getRandom([2, 3, 4]);
        const func = this._getRandom(['sin', 'cos', 'tan']);
        const displayFunc = '\\' + func;
        const isDeg = level.unit === 'deg';

        const refAngleDeg = parseInt(refAngleObj.deg);
        let angleDeg;

        if (quadrant === 2) angleDeg = 180 - refAngleDeg;
        else if (quadrant === 3) angleDeg = 180 + refAngleDeg;
        else angleDeg = 360 - refAngleDeg;

        const angleObj = this.ALL_ANGLES.find(a => parseInt(a.deg) === angleDeg);
        if (!angleObj) throw new Error(`Angle not found: ${angleDeg}°`);

        const angleText = isDeg ? angleObj.deg : angleObj.rad;
        const isPositive = this.CAST_RULES[func].includes(quadrant);
        const value = refAngleObj[func];
        const answer = isPositive ? value : `-${value}`;

        return {
            format: `${displayFunc}(${angleText}) = \\_\\_\\_`,
            answer: answer,
            angleDeg: angleDeg,
            quadrant: quadrant,
            type: 'quadrant'
        };
    }

    generateEquivalentRatio(level) {
        const isDeg = level.unit === 'deg';
        const func = this._getRandom(['sin', 'cos', 'tan']);
        const displayFunc = '\\' + func;

        const refAngles = this.TRIG_VALUES.filter(a => parseInt(a.deg) > 0 && parseInt(a.deg) < 90);
        const refAngleObj = this._getRandom(refAngles);
        const refAngleDeg = parseInt(refAngleObj.deg);
        const refAngleText = isDeg ? refAngleObj.deg : refAngleObj.rad;

        const quadrant = this._getRandom([2, 3, 4]);
        let angleDeg;

        if (quadrant === 2) angleDeg = 180 - refAngleDeg;
        else if (quadrant === 3) angleDeg = 180 + refAngleDeg;
        else angleDeg = 360 - refAngleDeg;

        const angleObj = this.ALL_ANGLES.find(a => parseInt(a.deg) === angleDeg);
        if (!angleObj) throw new Error(`Angle not found: ${angleDeg}°`);

        const angleText = isDeg ? angleObj.deg : angleObj.rad;
        const isPositive = this.CAST_RULES[func].includes(quadrant);
        const signChar = isPositive ? '' : '-';
        const answer = `${signChar}${displayFunc}(${refAngleText})`;

        return {
            format: `${displayFunc}(${angleText}) = \\_\\_\\_`,
            answer: answer,
            angleDeg: angleDeg,
            quadrant: quadrant,
            type: 'equivalent'
        };
    }

    generateConversion(level) {
        const angle = this._getRandom(this.ALL_ANGLES);
        const direction = (level.direction === 'mixed')
            ? this._getRandom(['d2r', 'r2d'])
            : level.direction;

        if (direction === 'd2r') {
            return {
                format: `${angle.deg} = \\_\\_\\_ \\text{ rad}`,
                answer: angle.rad,
                type: 'conversion_d2r'
            };
        } else {
            return {
                format: `${angle.rad} = \\_\\_\\_^{\\circ}`,
                answer: angle.deg,
                type: 'conversion_r2d'
            };
        }
    }

    _getRandom(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }
}
