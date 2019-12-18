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
/*
 * This file is part of evQueue
 *
 * evQueue is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * evQueue is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with evQueue. If not, see <http://www.gnu.org/licenses/>.
 *
 * Author: Thibault Kummer
 */

class evQueueWS {
	constructor(context, callback) {
		this.context = context;
		this.callback = callback;

		this.nodes = document.querySelector("body").dataset.nodes.split(',');
		for (var i = 0; i < this.nodes.length; i++) this.nodes[i] = this.nodes[i].replace('tcp://', 'ws://');

		this.nodes_names = document.querySelector("body").dataset.nodesnames.split(',');

		this.failed_nodes = 0;
		this.connected_nodes = 0;
		this.current_node = 0;
		this.ws = [];
		this.state = [];
	}

	GetNodes() {
		return this.nodes_names;
	}

	ChangeNode(idx) {
		this.Close();
		return this.Connect(idx);
	}

	GetConnectedNodes() {
		return this.connected_nodes;
	}

	Connect(idx = 0) {
		this.current_node = idx;

		var self = this;
		return new Promise(function (resolve, reject) {
			if (idx == '*') {
				for (var i = 0; i < self.nodes.length; i++) self.connect(i, resolve, reject);
			} else self.connect(idx, resolve, reject);
		});
	}

	connect(idx, resolve, reject) {
		var self = this;

		self.ws[idx] = new WebSocket(self.nodes[idx], "events");

		self.time_delta = 0;

		self.state[idx] = 'CONNECTING';

		self.ws[idx].onopen = function (event) {
			console.log("Connected to node " + self.nodes_names[idx]);
		};

		self.ws[idx].onclose = function (event) {
			if (self.state[idx] == 'READY') self.connected_nodes--;

			self.failed_nodes++;

			self.state[idx] = 'DISCONNECTED';
			console.log("Disconnected from node " + self.nodes_names[idx]);
		};

		self.ws[idx].onmessage = function (event) {
			var parser = new DOMParser();
			var xmldoc = parser.parseFromString(event.data, "text/xml");

			if (self.state[idx] == 'CONNECTING') {
				var challenge = xmldoc.documentElement.getAttribute("challenge");

				var user = document.querySelector("body").dataset.user;
				var passwd_hash = CryptoJS.enc.Hex.parse(document.querySelector("body").dataset.password);
				var response = CryptoJS.HmacSHA1(CryptoJS.enc.Hex.parse(challenge), passwd_hash).toString(CryptoJS.enc.Hex);

				self.ws[idx].send("<auth response='" + response + "' user='" + user + "' />");
				self.state[idx] = 'AUTHENTICATED';
			} else if (self.state[idx] == 'AUTHENTICATED') {
				var time = xmldoc.documentElement.getAttribute("time");
				self.time_delta = Date.now() - Date.parse(time);

				self.state[idx] = 'READY';
				self.connected_nodes++;
				if (self.connected_nodes + self.failed_nodes == self.nodes.length && self.current_node == '*') resolve();else if (self.current_node != '*') resolve();
			} else if (self.state[idx] == 'READY') {
				var parser = new DOMParser();
				var xmldoc = parser.parseFromString(event.data, "text/xml");

				var ret = { response: [] };

				var root = xmldoc.documentElement;
				for (var i = 0; i < root.attributes.length; i++) ret[root.attributes[i].name] = root.attributes[i].value;

				var nodes_ite = xmldoc.evaluate(self.output_xpath_filter, xmldoc.documentElement);
				var node;
				while (node = nodes_ite.iterateNext()) {
					var obj = {};
					for (var i = 0; i < node.attributes.length; i++) obj[node.attributes[i].name] = node.attributes[i].value;
					ret.response.push(obj);
				}
				self.callback(self.context, ret);
			}
		};
	}

	Close() {
		if (this.current_node == '*') {
			for (var i = 0; i < this.nodes.length; i++) this.close(i);
		} else this.close(this.current_node);
	}

	close(idx) {
		this.ws[idx].close();
	}

	GetTimeDelta() {
		return this.time_delta;
	}

	Subscribe(event, api, output_xpath_filter = "/response/*") {
		if (this.current_node == '*') {
			for (var i = 0; i < this.nodes.length; i++) this.subscribe(i, event, api.group, api.action, api.parameters, output_xpath_filter);
		} else this.subscribe(this.current_node, event, api.group, api.action, api.parameters, output_xpath_filter);
	}

	subscribe(idx, event, group, action, parameters, output_xpath_filter = "/response/*") {
		if (this.state[idx] != 'READY') return;

		this.output_xpath_filter = output_xpath_filter;

		var xmldoc = new Document();
		var api_node = xmldoc.createElement(group);
		api_node.setAttribute('action', action);
		xmldoc.appendChild(api_node);
		for (var parameter in parameters) api_node.setAttribute(parameter, parameters[parameter]);
		var api_cmd = new XMLSerializer().serializeToString(xmldoc);

		var api_cmd_b64 = btoa(api_cmd);
		this.ws[idx].send("<event action='subscribe' type='" + event + "' api_cmd='" + api_cmd_b64 + "' />");
	}

	UnsubscribeAll(api_cmd, event) {
		if (this.current_node == '*') {
			for (var i = 0; i < this.nodes.length; i++) this.unsubscribeAll(i);
		} else this.unsubscribeAll(this.current_node);
	}

	unsubscribeAll(idx) {
		if (this.state[idx] != 'READY') return;

		this.ws[idx].send("<event action='unsubscribeall' />");
	}
}
/*
 * This file is part of evQueue
 *
 * evQueue is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * evQueue is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with evQueue. If not, see <http://www.gnu.org/licenses/>.
 *
 * Author: Thibault Kummer
 */

'use strict';

class evQueueComponent extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			refresh: true
		};

		this.toggleAutorefresh = this.toggleAutorefresh.bind(this);

		this.node = 0;
	}

	toggleAutorefresh() {
		this.setState({ refresh: !this.state.refresh });
	}

	componentDidMount() {
		this.evqueue = new evQueueWS(this, this.evQueueEvent);

		if (this.node == '*' || this.node == 'any') return this.evqueue.Connect('*');else return this.evqueue.Connect(this.node);
	}

	componentWillUnmount() {
		this.evqueue.Close();
	}
}
/*
 * This file is part of evQueue
 *
 * evQueue is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * evQueue is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with evQueue. If not, see <http://www.gnu.org/licenses/>.
 *
 * Author: Thibault Kummer
 */

'use strict';

class ListInstances extends evQueueComponent {
	constructor(props) {
		super(props);

		this.state.workflows = {};
	}

	evQueueEvent(context, data) {
		if (context.node == '*') {
			for (var i = 0; i < data.response.length; i++) data.response[i].node_name = data.node;

			var current_state = context.state.workflows;
			current_state[data.node] = data.response;
		} else var current_state = { current: data.response };

		if (context.state.refresh) context.setState({ workflows: current_state });else context.state.workflows = current_state;
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
		var ret = [];

		for (var node in this.state.workflows) {
			ret = ret.concat(this.state.workflows[node].map(wf => {
				wf.wf_status = wf.status; // .status seems to be reserved by react, in any case it is replaced by a boolean in the rendered HTML
				return React.createElement(
					'tr',
					{ key: wf.id,
						'data-id': wf.id,
						'data-node': wf.node_name,
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
							{ className: 'action showWorkflowDetails', 'data-id': wf.id, 'data-node-name': wf.node_name, 'data-status': wf.wf_status },
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
						wf.node_name
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
			}));
		}

		return ret;
	}

	renderWorkflows() {
		if (Object.keys(this.state.workflows).length == 0) return React.createElement(
			'div',
			{ className: 'center' },
			React.createElement('br', null),
			'Loading...'
		);

		var n = 0;
		for (var node in this.state.workflows) n += this.state.workflows[node].length;

		if (n == 0) return React.createElement(
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
		return React.createElement(
			'div',
			null,
			this.renderTitle(),
			this.renderWorkflows()
		);
	}
}
/*
 * This file is part of evQueue
 *
 * evQueue is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * evQueue is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with evQueue. If not, see <http://www.gnu.org/licenses/>.
 *
 * Author: Thibault Kummer
 */

'use strict';

class ListQueues extends evQueueComponent {
	constructor(props) {
		super(props);

		this.state.nodes = [];
		this.state.queues = [];
		this.state.idx = 0;

		this.changeNode = this.changeNode.bind(this);
		this.node = 0;
	}

	subscribe() {
		var api = { group: 'statistics', action: 'query', parameters: { type: 'queue' } };
		this.evqueue.Subscribe('QUEUE_ENQUEUE', api, '/response/statistics/*');
		this.evqueue.Subscribe('QUEUE_DEQUEUE', api, '/response/statistics/*');
		this.evqueue.Subscribe('QUEUE_EXECUTE', api, '/response/statistics/*');
		this.evqueue.Subscribe('QUEUE_TERMINATE', api, '/response/statistics/*');
	}

	componentDidMount() {
		var self = this;
		super.componentDidMount().then(() => {
			self.subscribe();
			self.setState({ nodes: self.evqueue.GetNodes() });
		});
	}

	changeNode(event) {
		var self = this;
		self.setState({ idx: event.target.dataset.idx });
		this.evqueue.ChangeNode(event.target.dataset.idx).then(() => {
			self.subscribe();
		});
	}

	evQueueEvent(context, data) {
		if (context.state.refresh) context.setState({ queues: data.response });else context.state.queues = data.response;
	}

	renderQueuesList() {
		return this.state.queues.map(queue => {
			var running_prct = queue.running_tasks / queue.concurrency * 100;
			var queue_prct = queue.size > 20 ? 100 : queue.size / 20 * 100;
			return React.createElement(
				'tr',
				{ key: queue.name, className: 'evenOdd' },
				React.createElement(
					'td',
					null,
					queue.name
				),
				React.createElement(
					'td',
					{ className: 'center' },
					queue.scheduler
				),
				React.createElement(
					'td',
					{ className: 'center' },
					queue.concurrency
				),
				React.createElement(
					'td',
					null,
					React.createElement(
						'div',
						{ className: 'prctgradient' },
						React.createElement(
							'div',
							{ style: { background: 'linear-gradient(to right,transparent ' + running_prct + '%,white ' + running_prct + '%)' } },
							React.createElement(
								'div',
								{ style: { textAlign: 'right', width: running_prct + '%' } },
								Math.round(running_prct),
								'\xA0%'
							)
						)
					),
					queue.running_tasks,
					' task',
					queue.running_tasks ? 's' : '',
					' running.'
				),
				React.createElement(
					'td',
					null,
					React.createElement(
						'div',
						{ className: 'prctgradient' },
						React.createElement(
							'div',
							{ style: { background: "linear-gradient(to right,transparent " + queue_prct + "%,white " + queue_prct + "%)" } },
							React.createElement(
								'div',
								{ style: { textAlign: 'right', width: queue_prct + '%' } },
								'\xA0'
							)
						)
					),
					queue.size,
					' awaiting task',
					queue.size > 1 ? 's' : '',
					' in queue.'
				)
			);
		});
	}

	renderNodesList() {
		var ret = [];
		for (var i = 0; i < this.state.nodes.length; i++) {
			var node = this.state.nodes[i];
			ret.push(React.createElement(
				'li',
				{ key: node, 'data-idx': i, className: this.state.idx == i ? 'selected' : '', onClick: this.changeNode },
				node
			));
		}
		return ret;
	}

	renderQueues() {
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
							null,
							'Name'
						),
						React.createElement(
							'th',
							null,
							'Scheduler'
						),
						React.createElement(
							'th',
							null,
							'Concurrency'
						),
						React.createElement(
							'th',
							null,
							'Running tasks'
						),
						React.createElement(
							'th',
							null,
							'Queued tasks'
						)
					)
				),
				React.createElement(
					'tbody',
					null,
					this.renderQueuesList()
				)
			)
		);
	}

	render() {
		return React.createElement(
			'div',
			null,
			React.createElement(
				'div',
				{ className: 'boxTitle' },
				React.createElement(
					'span',
					{ className: 'title' },
					'Queues States'
				),
				React.createElement('span', { className: "faicon fa-refresh action" + (this.state.refresh ? ' fa-spin' : ''), onClick: this.toggleAutorefresh })
			),
			React.createElement(
				'ul',
				{ className: 'reacttabs' },
				this.renderNodesList()
			),
			this.renderQueues()
		);
	}
}

if (document.querySelector('#queues')) ReactDOM.render(React.createElement(ListQueues, null), document.querySelector('#queues'));
/*
 * This file is part of evQueue
 *
 * evQueue is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * evQueue is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with evQueue. If not, see <http://www.gnu.org/licenses/>.
 *
 * Author: Thibault Kummer
 */

'use strict';

class ExecutingInstances extends ListInstances {
	constructor(props) {
		super(props);

		this.state.now = 0;
		this.state.ready = false;
		this.timerID = false;
		this.node = '*';
	}

	componentDidMount() {
		var self = this;

		super.componentDidMount().then(() => {
			var api = { group: 'status', action: 'query', parameters: { type: 'workflows' } };
			self.evqueue.Subscribe('INSTANCE_STARTED', api);
			self.evqueue.Subscribe('INSTANCE_TERMINATED', api);
			this.setState({ ready: true });
		});

		this.setState({ now: this.now() });
		this.timerID = setInterval(() => this.state.refresh ? this.setState({ now: this.now() }) : this.state.now = this.now(), 1000);
	}

	componentWillUnmount() {
		super.componentWillUnmount();
		clearInterval(this.timerID);
	}

	now() {
		return Date.now();
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

	renderNodeStatus() {
		if (!this.state.ready) return React.createElement('div', null);

		var nodes_up = this.evqueue.GetConnectedNodes();
		var nodes_down = this.evqueue.GetNodes().length - this.evqueue.GetConnectedNodes();
		if (nodes_down == 0) return React.createElement(
			'a',
			{ href: 'nodes.php' },
			React.createElement(
				'span',
				{ className: 'success' },
				nodes_up,
				' node',
				nodes_up != 1 ? 's' : '',
				' up'
			)
		);
		return React.createElement(
			'a',
			{ href: 'nodes.php' },
			React.createElement(
				'span',
				{ className: 'success' },
				nodes_up,
				' node',
				nodes_up != 1 ? 's' : '',
				' up - ',
				React.createElement(
					'span',
					{ className: 'error' },
					nodes_down,
					' node',
					nodes_down != 1 ? 's' : '',
					' down'
				)
			)
		);
	}

	renderTitle() {
		var n = 0;
		for (var node in this.state.workflows) n += this.state.workflows[node].length;

		return React.createElement(
			'div',
			{ className: 'boxTitle' },
			React.createElement(
				'div',
				{ id: 'nodes-status' },
				this.renderNodeStatus()
			),
			React.createElement(
				'span',
				{ className: 'title' },
				'Executing workflows'
			),
			'\xA0(',
			n,
			')',
			React.createElement('span', { className: "faicon fa-refresh action" + (this.state.refresh ? ' fa-spin' : ''), onClick: this.toggleAutorefresh }),
			React.createElement('span', { className: 'faicon fa-rocket action', title: 'Launch a new workflow' }),
			React.createElement('span', { className: 'faicon fa-clock-o action', title: 'Retry all pending tasks' })
		);
	}
}

if (document.querySelector('#executing-workflows')) ReactDOM.render(React.createElement(ExecutingInstances, null), document.querySelector('#executing-workflows'));
/*
 * This file is part of evQueue
 *
 * evQueue is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * evQueue is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with evQueue. If not, see <http://www.gnu.org/licenses/>.
 *
 * Author: Thibault Kummer
 */

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
		this.node = 'any';
	}

	componentDidMount() {
		var self = this;
		super.componentDidMount().then(() => {
			var api = { group: 'instances', action: 'list' };
			self.evqueue.Subscribe('INSTANCE_TERMINATED', api);
		});
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

if (document.querySelector('#terminated-workflows')) var terminated_instances = ReactDOM.render(React.createElement(TerminatedInstances, null), document.querySelector('#terminated-workflows'));
