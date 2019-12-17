/*
CryptoJS v3.1.2
code.google.com/p/crypto-js
(c) 2009-2013 by Jeff Mott. All rights reserved.
code.google.com/p/crypto-js/wiki/License
*/
/**
 * CryptoJS core components.
 */
var CryptoJS = CryptoJS || function (Math, undefined) {
    /**
     * CryptoJS namespace.
     */
    var C = {};

    /**
     * Library namespace.
     */
    var C_lib = C.lib = {};

    /**
     * Base object for prototypal inheritance.
     */
    var Base = C_lib.Base = function () {
        function F() {}

        return {
            /**
             * Creates a new object that inherits from this object.
             *
             * @param {Object} overrides Properties to copy into the new object.
             *
             * @return {Object} The new object.
             *
             * @static
             *
             * @example
             *
             *     var MyType = CryptoJS.lib.Base.extend({
             *         field: 'value',
             *
             *         method: function () {
             *         }
             *     });
             */
            extend: function (overrides) {
                // Spawn
                F.prototype = this;
                var subtype = new F();

                // Augment
                if (overrides) {
                    subtype.mixIn(overrides);
                }

                // Create default initializer
                if (!subtype.hasOwnProperty('init')) {
                    subtype.init = function () {
                        subtype.$super.init.apply(this, arguments);
                    };
                }

                // Initializer's prototype is the subtype object
                subtype.init.prototype = subtype;

                // Reference supertype
                subtype.$super = this;

                return subtype;
            },

            /**
             * Extends this object and runs the init method.
             * Arguments to create() will be passed to init().
             *
             * @return {Object} The new object.
             *
             * @static
             *
             * @example
             *
             *     var instance = MyType.create();
             */
            create: function () {
                var instance = this.extend();
                instance.init.apply(instance, arguments);

                return instance;
            },

            /**
             * Initializes a newly created object.
             * Override this method to add some logic when your objects are created.
             *
             * @example
             *
             *     var MyType = CryptoJS.lib.Base.extend({
             *         init: function () {
             *             // ...
             *         }
             *     });
             */
            init: function () {},

            /**
             * Copies properties into this object.
             *
             * @param {Object} properties The properties to mix in.
             *
             * @example
             *
             *     MyType.mixIn({
             *         field: 'value'
             *     });
             */
            mixIn: function (properties) {
                for (var propertyName in properties) {
                    if (properties.hasOwnProperty(propertyName)) {
                        this[propertyName] = properties[propertyName];
                    }
                }

                // IE won't copy toString using the loop above
                if (properties.hasOwnProperty('toString')) {
                    this.toString = properties.toString;
                }
            },

            /**
             * Creates a copy of this object.
             *
             * @return {Object} The clone.
             *
             * @example
             *
             *     var clone = instance.clone();
             */
            clone: function () {
                return this.init.prototype.extend(this);
            }
        };
    }();

    /**
     * An array of 32-bit words.
     *
     * @property {Array} words The array of 32-bit words.
     * @property {number} sigBytes The number of significant bytes in this word array.
     */
    var WordArray = C_lib.WordArray = Base.extend({
        /**
         * Initializes a newly created word array.
         *
         * @param {Array} words (Optional) An array of 32-bit words.
         * @param {number} sigBytes (Optional) The number of significant bytes in the words.
         *
         * @example
         *
         *     var wordArray = CryptoJS.lib.WordArray.create();
         *     var wordArray = CryptoJS.lib.WordArray.create([0x00010203, 0x04050607]);
         *     var wordArray = CryptoJS.lib.WordArray.create([0x00010203, 0x04050607], 6);
         */
        init: function (words, sigBytes) {
            words = this.words = words || [];

            if (sigBytes != undefined) {
                this.sigBytes = sigBytes;
            } else {
                this.sigBytes = words.length * 4;
            }
        },

        /**
         * Converts this word array to a string.
         *
         * @param {Encoder} encoder (Optional) The encoding strategy to use. Default: CryptoJS.enc.Hex
         *
         * @return {string} The stringified word array.
         *
         * @example
         *
         *     var string = wordArray + '';
         *     var string = wordArray.toString();
         *     var string = wordArray.toString(CryptoJS.enc.Utf8);
         */
        toString: function (encoder) {
            return (encoder || Hex).stringify(this);
        },

        /**
         * Concatenates a word array to this word array.
         *
         * @param {WordArray} wordArray The word array to append.
         *
         * @return {WordArray} This word array.
         *
         * @example
         *
         *     wordArray1.concat(wordArray2);
         */
        concat: function (wordArray) {
            // Shortcuts
            var thisWords = this.words;
            var thatWords = wordArray.words;
            var thisSigBytes = this.sigBytes;
            var thatSigBytes = wordArray.sigBytes;

            // Clamp excess bits
            this.clamp();

            // Concat
            if (thisSigBytes % 4) {
                // Copy one byte at a time
                for (var i = 0; i < thatSigBytes; i++) {
                    var thatByte = thatWords[i >>> 2] >>> 24 - i % 4 * 8 & 0xff;
                    thisWords[thisSigBytes + i >>> 2] |= thatByte << 24 - (thisSigBytes + i) % 4 * 8;
                }
            } else if (thatWords.length > 0xffff) {
                // Copy one word at a time
                for (var i = 0; i < thatSigBytes; i += 4) {
                    thisWords[thisSigBytes + i >>> 2] = thatWords[i >>> 2];
                }
            } else {
                // Copy all words at once
                thisWords.push.apply(thisWords, thatWords);
            }
            this.sigBytes += thatSigBytes;

            // Chainable
            return this;
        },

        /**
         * Removes insignificant bits.
         *
         * @example
         *
         *     wordArray.clamp();
         */
        clamp: function () {
            // Shortcuts
            var words = this.words;
            var sigBytes = this.sigBytes;

            // Clamp
            words[sigBytes >>> 2] &= 0xffffffff << 32 - sigBytes % 4 * 8;
            words.length = Math.ceil(sigBytes / 4);
        },

        /**
         * Creates a copy of this word array.
         *
         * @return {WordArray} The clone.
         *
         * @example
         *
         *     var clone = wordArray.clone();
         */
        clone: function () {
            var clone = Base.clone.call(this);
            clone.words = this.words.slice(0);

            return clone;
        },

        /**
         * Creates a word array filled with random bytes.
         *
         * @param {number} nBytes The number of random bytes to generate.
         *
         * @return {WordArray} The random word array.
         *
         * @static
         *
         * @example
         *
         *     var wordArray = CryptoJS.lib.WordArray.random(16);
         */
        random: function (nBytes) {
            var words = [];
            for (var i = 0; i < nBytes; i += 4) {
                words.push(Math.random() * 0x100000000 | 0);
            }

            return new WordArray.init(words, nBytes);
        }
    });

    /**
     * Encoder namespace.
     */
    var C_enc = C.enc = {};

    /**
     * Hex encoding strategy.
     */
    var Hex = C_enc.Hex = {
        /**
         * Converts a word array to a hex string.
         *
         * @param {WordArray} wordArray The word array.
         *
         * @return {string} The hex string.
         *
         * @static
         *
         * @example
         *
         *     var hexString = CryptoJS.enc.Hex.stringify(wordArray);
         */
        stringify: function (wordArray) {
            // Shortcuts
            var words = wordArray.words;
            var sigBytes = wordArray.sigBytes;

            // Convert
            var hexChars = [];
            for (var i = 0; i < sigBytes; i++) {
                var bite = words[i >>> 2] >>> 24 - i % 4 * 8 & 0xff;
                hexChars.push((bite >>> 4).toString(16));
                hexChars.push((bite & 0x0f).toString(16));
            }

            return hexChars.join('');
        },

        /**
         * Converts a hex string to a word array.
         *
         * @param {string} hexStr The hex string.
         *
         * @return {WordArray} The word array.
         *
         * @static
         *
         * @example
         *
         *     var wordArray = CryptoJS.enc.Hex.parse(hexString);
         */
        parse: function (hexStr) {
            // Shortcut
            var hexStrLength = hexStr.length;

            // Convert
            var words = [];
            for (var i = 0; i < hexStrLength; i += 2) {
                words[i >>> 3] |= parseInt(hexStr.substr(i, 2), 16) << 24 - i % 8 * 4;
            }

            return new WordArray.init(words, hexStrLength / 2);
        }
    };

    /**
     * Latin1 encoding strategy.
     */
    var Latin1 = C_enc.Latin1 = {
        /**
         * Converts a word array to a Latin1 string.
         *
         * @param {WordArray} wordArray The word array.
         *
         * @return {string} The Latin1 string.
         *
         * @static
         *
         * @example
         *
         *     var latin1String = CryptoJS.enc.Latin1.stringify(wordArray);
         */
        stringify: function (wordArray) {
            // Shortcuts
            var words = wordArray.words;
            var sigBytes = wordArray.sigBytes;

            // Convert
            var latin1Chars = [];
            for (var i = 0; i < sigBytes; i++) {
                var bite = words[i >>> 2] >>> 24 - i % 4 * 8 & 0xff;
                latin1Chars.push(String.fromCharCode(bite));
            }

            return latin1Chars.join('');
        },

        /**
         * Converts a Latin1 string to a word array.
         *
         * @param {string} latin1Str The Latin1 string.
         *
         * @return {WordArray} The word array.
         *
         * @static
         *
         * @example
         *
         *     var wordArray = CryptoJS.enc.Latin1.parse(latin1String);
         */
        parse: function (latin1Str) {
            // Shortcut
            var latin1StrLength = latin1Str.length;

            // Convert
            var words = [];
            for (var i = 0; i < latin1StrLength; i++) {
                words[i >>> 2] |= (latin1Str.charCodeAt(i) & 0xff) << 24 - i % 4 * 8;
            }

            return new WordArray.init(words, latin1StrLength);
        }
    };

    /**
     * UTF-8 encoding strategy.
     */
    var Utf8 = C_enc.Utf8 = {
        /**
         * Converts a word array to a UTF-8 string.
         *
         * @param {WordArray} wordArray The word array.
         *
         * @return {string} The UTF-8 string.
         *
         * @static
         *
         * @example
         *
         *     var utf8String = CryptoJS.enc.Utf8.stringify(wordArray);
         */
        stringify: function (wordArray) {
            try {
                return decodeURIComponent(escape(Latin1.stringify(wordArray)));
            } catch (e) {
                throw new Error('Malformed UTF-8 data');
            }
        },

        /**
         * Converts a UTF-8 string to a word array.
         *
         * @param {string} utf8Str The UTF-8 string.
         *
         * @return {WordArray} The word array.
         *
         * @static
         *
         * @example
         *
         *     var wordArray = CryptoJS.enc.Utf8.parse(utf8String);
         */
        parse: function (utf8Str) {
            return Latin1.parse(unescape(encodeURIComponent(utf8Str)));
        }
    };

    /**
     * Abstract buffered block algorithm template.
     *
     * The property blockSize must be implemented in a concrete subtype.
     *
     * @property {number} _minBufferSize The number of blocks that should be kept unprocessed in the buffer. Default: 0
     */
    var BufferedBlockAlgorithm = C_lib.BufferedBlockAlgorithm = Base.extend({
        /**
         * Resets this block algorithm's data buffer to its initial state.
         *
         * @example
         *
         *     bufferedBlockAlgorithm.reset();
         */
        reset: function () {
            // Initial values
            this._data = new WordArray.init();
            this._nDataBytes = 0;
        },

        /**
         * Adds new data to this block algorithm's buffer.
         *
         * @param {WordArray|string} data The data to append. Strings are converted to a WordArray using UTF-8.
         *
         * @example
         *
         *     bufferedBlockAlgorithm._append('data');
         *     bufferedBlockAlgorithm._append(wordArray);
         */
        _append: function (data) {
            // Convert string to WordArray, else assume WordArray already
            if (typeof data == 'string') {
                data = Utf8.parse(data);
            }

            // Append
            this._data.concat(data);
            this._nDataBytes += data.sigBytes;
        },

        /**
         * Processes available data blocks.
         *
         * This method invokes _doProcessBlock(offset), which must be implemented by a concrete subtype.
         *
         * @param {boolean} doFlush Whether all blocks and partial blocks should be processed.
         *
         * @return {WordArray} The processed data.
         *
         * @example
         *
         *     var processedData = bufferedBlockAlgorithm._process();
         *     var processedData = bufferedBlockAlgorithm._process(!!'flush');
         */
        _process: function (doFlush) {
            // Shortcuts
            var data = this._data;
            var dataWords = data.words;
            var dataSigBytes = data.sigBytes;
            var blockSize = this.blockSize;
            var blockSizeBytes = blockSize * 4;

            // Count blocks ready
            var nBlocksReady = dataSigBytes / blockSizeBytes;
            if (doFlush) {
                // Round up to include partial blocks
                nBlocksReady = Math.ceil(nBlocksReady);
            } else {
                // Round down to include only full blocks,
                // less the number of blocks that must remain in the buffer
                nBlocksReady = Math.max((nBlocksReady | 0) - this._minBufferSize, 0);
            }

            // Count words ready
            var nWordsReady = nBlocksReady * blockSize;

            // Count bytes ready
            var nBytesReady = Math.min(nWordsReady * 4, dataSigBytes);

            // Process blocks
            if (nWordsReady) {
                for (var offset = 0; offset < nWordsReady; offset += blockSize) {
                    // Perform concrete-algorithm logic
                    this._doProcessBlock(dataWords, offset);
                }

                // Remove processed words
                var processedWords = dataWords.splice(0, nWordsReady);
                data.sigBytes -= nBytesReady;
            }

            // Return processed words
            return new WordArray.init(processedWords, nBytesReady);
        },

        /**
         * Creates a copy of this object.
         *
         * @return {Object} The clone.
         *
         * @example
         *
         *     var clone = bufferedBlockAlgorithm.clone();
         */
        clone: function () {
            var clone = Base.clone.call(this);
            clone._data = this._data.clone();

            return clone;
        },

        _minBufferSize: 0
    });

    /**
     * Abstract hasher template.
     *
     * @property {number} blockSize The number of 32-bit words this hasher operates on. Default: 16 (512 bits)
     */
    var Hasher = C_lib.Hasher = BufferedBlockAlgorithm.extend({
        /**
         * Configuration options.
         */
        cfg: Base.extend(),

        /**
         * Initializes a newly created hasher.
         *
         * @param {Object} cfg (Optional) The configuration options to use for this hash computation.
         *
         * @example
         *
         *     var hasher = CryptoJS.algo.SHA256.create();
         */
        init: function (cfg) {
            // Apply config defaults
            this.cfg = this.cfg.extend(cfg);

            // Set initial values
            this.reset();
        },

        /**
         * Resets this hasher to its initial state.
         *
         * @example
         *
         *     hasher.reset();
         */
        reset: function () {
            // Reset data buffer
            BufferedBlockAlgorithm.reset.call(this);

            // Perform concrete-hasher logic
            this._doReset();
        },

        /**
         * Updates this hasher with a message.
         *
         * @param {WordArray|string} messageUpdate The message to append.
         *
         * @return {Hasher} This hasher.
         *
         * @example
         *
         *     hasher.update('message');
         *     hasher.update(wordArray);
         */
        update: function (messageUpdate) {
            // Append
            this._append(messageUpdate);

            // Update the hash
            this._process();

            // Chainable
            return this;
        },

        /**
         * Finalizes the hash computation.
         * Note that the finalize operation is effectively a destructive, read-once operation.
         *
         * @param {WordArray|string} messageUpdate (Optional) A final message update.
         *
         * @return {WordArray} The hash.
         *
         * @example
         *
         *     var hash = hasher.finalize();
         *     var hash = hasher.finalize('message');
         *     var hash = hasher.finalize(wordArray);
         */
        finalize: function (messageUpdate) {
            // Final message update
            if (messageUpdate) {
                this._append(messageUpdate);
            }

            // Perform concrete-hasher logic
            var hash = this._doFinalize();

            return hash;
        },

        blockSize: 512 / 32,

        /**
         * Creates a shortcut function to a hasher's object interface.
         *
         * @param {Hasher} hasher The hasher to create a helper for.
         *
         * @return {Function} The shortcut function.
         *
         * @static
         *
         * @example
         *
         *     var SHA256 = CryptoJS.lib.Hasher._createHelper(CryptoJS.algo.SHA256);
         */
        _createHelper: function (hasher) {
            return function (message, cfg) {
                return new hasher.init(cfg).finalize(message);
            };
        },

        /**
         * Creates a shortcut function to the HMAC's object interface.
         *
         * @param {Hasher} hasher The hasher to use in this HMAC helper.
         *
         * @return {Function} The shortcut function.
         *
         * @static
         *
         * @example
         *
         *     var HmacSHA256 = CryptoJS.lib.Hasher._createHmacHelper(CryptoJS.algo.SHA256);
         */
        _createHmacHelper: function (hasher) {
            return function (message, key) {
                return new C_algo.HMAC.init(hasher, key).finalize(message);
            };
        }
    });

    /**
     * Algorithm namespace.
     */
    var C_algo = C.algo = {};

    return C;
}(Math);
/*
CryptoJS v3.1.2
code.google.com/p/crypto-js
(c) 2009-2013 by Jeff Mott. All rights reserved.
code.google.com/p/crypto-js/wiki/License
*/
(function () {
            // Shortcuts
            var C = CryptoJS;
            var C_lib = C.lib;
            var Base = C_lib.Base;
            var C_enc = C.enc;
            var Utf8 = C_enc.Utf8;
            var C_algo = C.algo;

            /**
             * HMAC algorithm.
             */
            var HMAC = C_algo.HMAC = Base.extend({
                        /**
                         * Initializes a newly created HMAC.
                         *
                         * @param {Hasher} hasher The hash algorithm to use.
                         * @param {WordArray|string} key The secret key.
                         *
                         * @example
                         *
                         *     var hmacHasher = CryptoJS.algo.HMAC.create(CryptoJS.algo.SHA256, key);
                         */
                        init: function (hasher, key) {
                                    // Init hasher
                                    hasher = this._hasher = new hasher.init();

                                    // Convert string to WordArray, else assume WordArray already
                                    if (typeof key == 'string') {
                                                key = Utf8.parse(key);
                                    }

                                    // Shortcuts
                                    var hasherBlockSize = hasher.blockSize;
                                    var hasherBlockSizeBytes = hasherBlockSize * 4;

                                    // Allow arbitrary length keys
                                    if (key.sigBytes > hasherBlockSizeBytes) {
                                                key = hasher.finalize(key);
                                    }

                                    // Clamp excess bits
                                    key.clamp();

                                    // Clone key for inner and outer pads
                                    var oKey = this._oKey = key.clone();
                                    var iKey = this._iKey = key.clone();

                                    // Shortcuts
                                    var oKeyWords = oKey.words;
                                    var iKeyWords = iKey.words;

                                    // XOR keys with pad constants
                                    for (var i = 0; i < hasherBlockSize; i++) {
                                                oKeyWords[i] ^= 0x5c5c5c5c;
                                                iKeyWords[i] ^= 0x36363636;
                                    }
                                    oKey.sigBytes = iKey.sigBytes = hasherBlockSizeBytes;

                                    // Set initial values
                                    this.reset();
                        },

                        /**
                         * Resets this HMAC to its initial state.
                         *
                         * @example
                         *
                         *     hmacHasher.reset();
                         */
                        reset: function () {
                                    // Shortcut
                                    var hasher = this._hasher;

                                    // Reset
                                    hasher.reset();
                                    hasher.update(this._iKey);
                        },

                        /**
                         * Updates this HMAC with a message.
                         *
                         * @param {WordArray|string} messageUpdate The message to append.
                         *
                         * @return {HMAC} This HMAC instance.
                         *
                         * @example
                         *
                         *     hmacHasher.update('message');
                         *     hmacHasher.update(wordArray);
                         */
                        update: function (messageUpdate) {
                                    this._hasher.update(messageUpdate);

                                    // Chainable
                                    return this;
                        },

                        /**
                         * Finalizes the HMAC computation.
                         * Note that the finalize operation is effectively a destructive, read-once operation.
                         *
                         * @param {WordArray|string} messageUpdate (Optional) A final message update.
                         *
                         * @return {WordArray} The HMAC.
                         *
                         * @example
                         *
                         *     var hmac = hmacHasher.finalize();
                         *     var hmac = hmacHasher.finalize('message');
                         *     var hmac = hmacHasher.finalize(wordArray);
                         */
                        finalize: function (messageUpdate) {
                                    // Shortcut
                                    var hasher = this._hasher;

                                    // Compute HMAC
                                    var innerHash = hasher.finalize(messageUpdate);
                                    hasher.reset();
                                    var hmac = hasher.finalize(this._oKey.clone().concat(innerHash));

                                    return hmac;
                        }
            });
})();
/*
CryptoJS v3.1.2
code.google.com/p/crypto-js
(c) 2009-2013 by Jeff Mott. All rights reserved.
code.google.com/p/crypto-js/wiki/License
*/
(function () {
    // Shortcuts
    var C = CryptoJS;
    var C_lib = C.lib;
    var WordArray = C_lib.WordArray;
    var Hasher = C_lib.Hasher;
    var C_algo = C.algo;

    // Reusable object
    var W = [];

    /**
     * SHA-1 hash algorithm.
     */
    var SHA1 = C_algo.SHA1 = Hasher.extend({
        _doReset: function () {
            this._hash = new WordArray.init([0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476, 0xc3d2e1f0]);
        },

        _doProcessBlock: function (M, offset) {
            // Shortcut
            var H = this._hash.words;

            // Working variables
            var a = H[0];
            var b = H[1];
            var c = H[2];
            var d = H[3];
            var e = H[4];

            // Computation
            for (var i = 0; i < 80; i++) {
                if (i < 16) {
                    W[i] = M[offset + i] | 0;
                } else {
                    var n = W[i - 3] ^ W[i - 8] ^ W[i - 14] ^ W[i - 16];
                    W[i] = n << 1 | n >>> 31;
                }

                var t = (a << 5 | a >>> 27) + e + W[i];
                if (i < 20) {
                    t += (b & c | ~b & d) + 0x5a827999;
                } else if (i < 40) {
                    t += (b ^ c ^ d) + 0x6ed9eba1;
                } else if (i < 60) {
                    t += (b & c | b & d | c & d) - 0x70e44324;
                } else /* if (i < 80) */{
                        t += (b ^ c ^ d) - 0x359d3e2a;
                    }

                e = d;
                d = c;
                c = b << 30 | b >>> 2;
                b = a;
                a = t;
            }

            // Intermediate hash value
            H[0] = H[0] + a | 0;
            H[1] = H[1] + b | 0;
            H[2] = H[2] + c | 0;
            H[3] = H[3] + d | 0;
            H[4] = H[4] + e | 0;
        },

        _doFinalize: function () {
            // Shortcuts
            var data = this._data;
            var dataWords = data.words;

            var nBitsTotal = this._nDataBytes * 8;
            var nBitsLeft = data.sigBytes * 8;

            // Add padding
            dataWords[nBitsLeft >>> 5] |= 0x80 << 24 - nBitsLeft % 32;
            dataWords[(nBitsLeft + 64 >>> 9 << 4) + 14] = Math.floor(nBitsTotal / 0x100000000);
            dataWords[(nBitsLeft + 64 >>> 9 << 4) + 15] = nBitsTotal;
            data.sigBytes = dataWords.length * 4;

            // Hash final blocks
            this._process();

            // Return final computed hash
            return this._hash;
        },

        clone: function () {
            var clone = Hasher.clone.call(this);
            clone._hash = this._hash.clone();

            return clone;
        }
    });

    /**
     * Shortcut function to the hasher's object interface.
     *
     * @param {WordArray|string} message The message to hash.
     *
     * @return {WordArray} The hash.
     *
     * @static
     *
     * @example
     *
     *     var hash = CryptoJS.SHA1('message');
     *     var hash = CryptoJS.SHA1(wordArray);
     */
    C.SHA1 = Hasher._createHelper(SHA1);

    /**
     * Shortcut function to the HMAC's object interface.
     *
     * @param {WordArray|string} message The message to hash.
     * @param {WordArray|string} key The secret key.
     *
     * @return {WordArray} The HMAC.
     *
     * @static
     *
     * @example
     *
     *     var hmac = CryptoJS.HmacSHA1(message, key);
     */
    C.HmacSHA1 = Hasher._createHmacHelper(SHA1);
})();
class evQueueWS {
	constructor(context, callback) {
		this.context = context;
		this.callback = callback;
	}

	Connect(context, subscriptions, callback) {
		var self = this;

		return new Promise(function (resolve, reject) {

			self.ws = new WebSocket("ws://srvdev:5001/", "events");

			self.time_delta = 0;

			self.state = 'CONNECTING';

			self.ws.onopen = function (event) {
				console.log("Connected to evQueue Websocket");
			};

			self.ws.onclose = function (event) {
				console.log("Disconnected from evQueue Websocket");
			};

			self.ws.onmessage = function (event) {
				var parser = new DOMParser();
				var xmldoc = parser.parseFromString(event.data, "text/xml");

				if (self.state == 'CONNECTING') {
					var challenge = xmldoc.documentElement.getAttribute("challenge");

					var passwd_hash = CryptoJS.SHA1("admin");
					var response = CryptoJS.HmacSHA1(CryptoJS.enc.Hex.parse(challenge), passwd_hash).toString(CryptoJS.enc.Hex);

					self.ws.send("<auth response='" + response + "' user='admin' />");
					self.state = 'AUTHENTICATED';
				} else if (self.state == 'AUTHENTICATED') {
					var time = xmldoc.documentElement.getAttribute("time");
					self.time_delta = Date.now() - Date.parse(time);

					self.state = 'READY';
					resolve();
				} else if (self.state == 'READY') {
					var parser = new DOMParser();
					var xmldoc = parser.parseFromString(event.data, "text/xml");

					var ret = { response: [] };

					var root = xmldoc.documentElement;
					for (var i = 0; i < root.attributes.length; i++) ret[root.attributes[i].name] = root.attributes[i].value;

					var nodes_ite = xmldoc.evaluate('/response/*', xmldoc.documentElement);
					var node;
					while (node = nodes_ite.iterateNext()) {
						var obj = {};
						for (var i = 0; i < node.attributes.length; i++) obj[node.attributes[i].name] = node.attributes[i].value;
						ret.response.push(obj);
					}
					self.callback(self.context, ret);
				}
			};
		});
	}

	Close() {
		this.ws.close();
	}

	GetTimeDelta() {
		return this.time_delta;
	}

	Subscribe(event, group, action, parameters) {
		var xmldoc = new Document();
		var api_node = xmldoc.createElement(group);
		api_node.setAttribute('action', action);
		xmldoc.appendChild(api_node);
		for (var parameter in parameters) api_node.setAttribute(parameter, parameters[parameter]);
		var api_cmd = new XMLSerializer().serializeToString(xmldoc);

		var api_cmd_b64 = btoa(api_cmd);
		this.ws.send("<event action='subscribe' type='" + event + "' api_cmd='" + api_cmd_b64 + "' />");
	}

	UnsubscribeAll(api_cmd, event) {
		this.ws.send("<event action='unsubscribeall' />");
	}
}
'use strict';

class ListInstances extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			refresh: true,
			now: 0,
			workflows: {
				node: 'unknown',
				response: []
			}
		};

		this.timerID = false;

		this.toggleAutorefresh = this.toggleAutorefresh.bind(this);
	}

	toggleAutorefresh() {
		this.setState({ refresh: !this.state.refresh });
		/*if(this.refresh)
  	this.forceUpdate();*/
	}

	now() {
		return Date.now();
		/*if(!this.evqueue)
  	return Date.now();
  return Date.now()-this.evqueue.GetTimeDelta();*/
	}

	componentDidMount() {
		this.evqueue = new evQueueWS(this, this.evQueueEvent);
		var evqueue_ready = this.evqueue.Connect();

		this.setState({ now: this.now() });

		return evqueue_ready;
	}

	componentWillUnmount() {
		this.evqueue.Close();
	}

	evQueueEvent(context, data) {
		if (context.state.refresh) context.setState({ workflows: data });else context.state.workflows = data;
	}

	humanTime(seconds) {
		if (seconds < 0) seconds = 0;
		seconds = Math.floor(seconds);
		return (seconds / 86400 >= 1 ? Math.floor(seconds / 86400) + ' days, ' : '') + (seconds / 3600 >= 1 ? Math.floor(seconds / 3600) % 24 + 'h ' : '') + (seconds / 60 >= 1 ? Math.floor(seconds / 60) % 60 + 'm ' : '') + seconds % 60 + 's';
	}

	timeSpan(dt1, dt2 = '') {
		var duration = (Date.parse(dt2) - Date.parse(dt1)) / 1000;

		if (dt1.split(' ')[0] == dt2.split[0]) dt2.replace(/^\d{4}-\d{2}-\d{2}/, ''); // don't display same date twice

		var dts = [dt1, dt2];
		var today = new Date().toISOString().substr(0, 10);
		var yesterday = new Date(Date.now() - 86400000).toISOString().substr(0, 10);
		var tomorrow = new Date(Date.now() + 86400000).toISOString().substr(0, 10);
		for (var i = 0; i < 2; i++) {
			dts[i] = dts[i].replace(new RegExp('^' + today), ''); // don't display today's date
			dts[i] = dts[i].replace(new RegExp('^' + yesterday), 'yesterday'); // 'yesterday' instead of date
			dts[i] = dts[i].replace(new RegExp('^' + tomorrow), 'tomorrow'); // 'tomorrow' instead of date
			dts[i] = dts[i].replace(/:\d+$/, ''); // don't display seconds
		}

		if (duration < 60) dts[1] = false;

		return dts[1] ? dts[0] + '→' + dts[1] : dts[0];
	}

	renderWorkflowsList() {
		return this.state.workflows.response.map(wf => {
			return React.createElement(
				'tr',
				{ key: wf.id,
					'data-id': wf.id,
					'data-node': this.getNode(wf),
					'data-running_tasks': wf.running_tasks,
					'data-retrying_tasks': wf.retrying_tasks,
					'data-queued_tasks': wf.queued_tasks,
					'data-error_tasks': wf.error_tasks,
					'data-waiting_conditions': wf.waiting_conditions
				},
				React.createElement(
					'td',
					{ className: 'center' },
					this.WorkflowStatus(wf)
				),
				React.createElement(
					'td',
					null,
					React.createElement(
						'span',
						{ className: 'action showWorkflowDetails', 'data-id': wf.id, 'data-node-name': this.getNode(wf), 'data-status': '{wf.status}' },
						wf.id,
						' \u2013 ',
						wf.name,
						' ',
						this.workflowInfos(wf),
						' (',
						this.workflowDuration(wf),
						')'
					),
					'\xA0'
				),
				React.createElement(
					'td',
					{ className: 'center' },
					this.getNode(wf)
				),
				React.createElement(
					'td',
					{ className: 'center' },
					wf.host ? wf.host : 'localhost'
				),
				React.createElement(
					'td',
					{ className: 'tdStarted' },
					this.timeSpan(wf.start_time, wf.end_time)
				),
				this.renderActions()
			);
		});
	}

	renderWorkflows() {
		if (this.state.workflows.node == 'unknown') return React.createElement(
			'div',
			{ className: 'center' },
			React.createElement('br', null),
			'Loading...'
		);

		if (this.state.workflows.response.length == 0) return React.createElement(
			'div',
			{ className: 'center' },
			React.createElement('br', null),
			'No workflow.'
		);

		return React.createElement(
			'div',
			{ className: 'workflow-list' },
			React.createElement(
				'table',
				null,
				React.createElement(
					'thead',
					null,
					React.createElement(
						'tr',
						null,
						React.createElement(
							'th',
							{ style: { width: '80px' }, className: 'center' },
							'State'
						),
						React.createElement(
							'th',
							null,
							'ID \u2013 Name'
						),
						React.createElement(
							'th',
							null,
							'Node'
						),
						React.createElement(
							'th',
							{ className: 'thStarted' },
							'Host'
						),
						React.createElement(
							'th',
							{ className: 'thStarted' },
							'Time'
						),
						React.createElement(
							'th',
							{ className: 'thActions' },
							'Actions'
						)
					)
				),
				React.createElement(
					'tbody',
					null,
					this.renderWorkflowsList()
				)
			)
		);
	}

	render() {
		this.state.now = this.now();

		return React.createElement(
			'div',
			null,
			this.renderTitle(),
			this.renderWorkflows()
		);
	}
}
'use strict';

class ExecutingInstances extends ListInstances {
	constructor(props) {
		super(props);
	}

	componentDidMount() {
		var self = this;
		super.componentDidMount().then(() => {
			self.evqueue.Subscribe('INSTANCE_STARTED', 'status', 'query', { type: 'workflows' });
			self.evqueue.Subscribe('INSTANCE_TERMINATED', 'status', 'query', { type: 'workflows' });
		});

		this.timerID = setInterval(() => this.state.refresh ? this.setState({ now: this.now() }) : this.state.now = this.now(), 1000);
	}

	componentWillUnmount() {
		super.componentWillUnmount();
		clearInterval(this.timerID);
	}

	getNode(wf) {
		return this.state.workflows.node;
	}

	workflowDuration(wf) {
		return this.humanTime((this.state.now - Date.parse(wf.start_time)) / 1000);
	}

	workflowInfos(wf) {
		return React.createElement('span', { className: 'faicon fa-info' });
	}

	renderActions() {
		return React.createElement(
			'td',
			{ className: 'tdActions' },
			React.createElement('span', { className: 'faicon fa-ban', title: 'Cancel this instance' }),
			React.createElement('span', { className: 'faicon fa-bomb', title: 'Kill this instance' })
		);
	}

	WorkflowStatus(wf) {
		if (wf.running_tasks - wf.queued_tasks > 0) return React.createElement('span', { className: 'fa fa-spinner fa-pulse fa-fw', title: 'Task(s) running' });

		if (wf.queued_tasks > 0) return React.createElement('span', { className: 'faicon fa-hand-stop-o', title: 'Task(s) queued' });

		if (wf.retrying_tasks > 0) return React.createElement('span', { className: 'faicon fa-clock-o', title: 'A task ended badly and will retry' });
	}

	renderTitle() {
		return React.createElement(
			'div',
			{ className: 'boxTitle' },
			React.createElement('div', { id: 'nodes-status' }),
			React.createElement(
				'span',
				{ className: 'title' },
				'Executing workflows'
			),
			'\xA0(',
			this.state.workflows.response.length,
			')',
			React.createElement('span', { className: "faicon fa-refresh action" + (this.state.refresh ? ' fa-spin' : ''), onClick: this.toggleAutorefresh }),
			React.createElement('span', { className: 'faicon fa-rocket action', title: 'Launch a new workflow' }),
			React.createElement('span', { className: 'faicon fa-clock-o action', title: 'Retry all pending tasks' })
		);
	}

	Toto() {
		console.log("Toto");
	}
}

ReactDOM.render(React.createElement(ExecutingInstances, null), document.querySelector('#executing-workflows'));
'use strict';

class TerminatedInstances extends ListInstances {
	constructor(props) {
		super(props);

		// Off-state attributes
		this.search_filters = {};
		this.current_page = 1;
		this.items_per_page = 30;

		// Bind actions
		this.nextPage = this.nextPage.bind(this);
		this.previousPage = this.previousPage.bind(this);
	}

	componentDidMount() {
		var self = this;
		super.componentDidMount().then(() => {
			self.evqueue.Subscribe('INSTANCE_TERMINATED', 'instances', 'list');
		});
	}

	getNode(wf) {
		return wf.node_name;
	}

	workflowDuration(wf) {
		return this.humanTime((Date.parse(wf.end_time) - Date.parse(wf.start_time)) / 1000);
	}

	workflowInfos(wf) {
		return React.createElement('span', { className: 'faicon fa-comment-o', title: "Comment : " + wf.comment });
	}

	renderActions() {
		return React.createElement(
			'td',
			{ className: 'tdActions' },
			React.createElement('span', { className: 'faicon fa-remove', title: 'Delete this instance' })
		);
	}

	WorkflowStatus(wf) {
		if (wf.status = 'TERMINATED' && wf.errors > 0) return React.createElement('span', { className: 'faicon fa-exclamation error', title: 'Errors' });

		if (wf.status = 'TERMINATED' && wf.errors == 0) return React.createElement('span', { className: 'faicon fa-check success', title: 'Workflow terminated' });
	}

	renderTitle() {
		return React.createElement(
			'div',
			{ className: 'boxTitle' },
			React.createElement('div', { id: 'nodes-status' }),
			React.createElement(
				'span',
				{ className: 'title' },
				'Terminated workflows'
			),
			'\xA0',
			this.current_page > 1 ? React.createElement('span', { className: 'faicon fa-backward', onClick: this.previousPage }) : '',
			'\xA0',
			(this.current_page - 1) * this.items_per_page + 1,
			' - ',
			this.current_page * this.items_per_page,
			' / ',
			this.state.workflows.rows,
			this.current_page * this.items_per_page < this.state.workflows.rows ? React.createElement('span', { className: 'faicon fa-forward', onClick: this.nextPage }) : '',
			React.createElement('span', { className: "faicon fa-refresh action" + (this.state.refresh ? ' fa-spin' : ''), onClick: this.toggleAutorefresh })
		);
	}

	updateFilters(search_filters) {
		this.search_filters = search_filters;

		this.evqueue.UnsubscribeAll();

		search_filters.limit = this.items_per_page;
		search_filters.offset = (this.current_page - 1) * this.items_per_page;
		this.evqueue.Subscribe('INSTANCE_TERMINATED', 'instances', 'list', search_filters);
	}

	nextPage() {
		this.current_page++;
		this.updateFilters(this.search_filters, this.current_page);
	}

	previousPage() {
		this.current_page--;
		this.updateFilters(this.search_filters, this.current_page);
	}
}

var terminated_instances = ReactDOM.render(React.createElement(TerminatedInstances, null), document.querySelector('#terminated-workflows'));
