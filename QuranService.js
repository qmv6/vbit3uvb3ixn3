const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');

const STATES_FILE = path.join(__dirname, 'quranStates.json');

class QuranService {
    constructor() {
        this.totalPages = 604;
        this.requiredRoleId = '1425553841906126930';
        this.pageUrls = this.loadPageUrls();
        this.userStates = this.loadUserStates();
    }

    loadPageUrls() {
        const urls = {
            1: 'https://i.postimg.cc/L5LWLMdM/1.png',
            2: 'https://i.postimg.cc/HnXNXCGH/2.png',
            3: 'https://i.postimg.cc/2yZsGZZJ/3.png',
            4: 'https://i.postimg.cc/Y0W5RWWT/4.png',
            5: 'https://i.postimg.cc/90ZkZj3m/5.png',
            6: 'https://i.postimg.cc/NFmnmwhM/6.png',
            7: 'https://i.postimg.cc/bJ2Vfjwj/7.png',
            8: 'https://i.postimg.cc/NFqJgPK2/8.png',
            9: 'https://i.postimg.cc/SRFTytnD/9.png',
            10: 'https://i.postimg.cc/1XhC9Y8W/10.png',
            11: 'https://i.postimg.cc/t4SB1g19/11.png',
            12: 'https://i.postimg.cc/BvRNgwBt/12.png',
            13: 'https://i.postimg.cc/cHYh5MFY/13.png',
            14: 'https://i.postimg.cc/7679QMKm/14.png',
            15: 'https://i.postimg.cc/6qf0B6Jv/15.png',
            16: 'https://i.postimg.cc/7hw3tvGv/16.png',
            17: 'https://i.postimg.cc/kGsxkjK7/17.png',
            18: 'https://i.postimg.cc/T10rZkgP/18.png',
            19: 'https://i.postimg.cc/8c4hqyM4/19.png',
            20: 'https://i.postimg.cc/t4whQnZW/20.png',
            21: 'https://i.postimg.cc/JhXj17j1/21.png',
            22: 'https://i.postimg.cc/BvF2qZ2t/22.png',
            23: 'https://i.postimg.cc/qRdygfGK/23.png',
            24: 'https://i.postimg.cc/xj5Mj4Nf/24.png',
            25: 'https://i.postimg.cc/xTFmMNRn/25.png',
            26: 'https://i.postimg.cc/JzfBdwvx/26.png',
            27: 'https://i.postimg.cc/zGsRPm69/27.png',
            28: 'https://i.postimg.cc/RF9J47M1/28.png',
            29: 'https://i.postimg.cc/jqMnYnBM/29.png',
            30: 'https://i.postimg.cc/L81JPC5X/30.png',
            31: 'https://i.postimg.cc/dVyhCH3y/31.png',
            32: 'https://i.postimg.cc/43RmQ6H1/32.png',
            33: 'https://i.postimg.cc/8CdsK7h6/33.png',
            34: 'https://i.postimg.cc/V6Dvw2Zm/34.png',
            35: 'https://i.postimg.cc/2yy6STg7/35.png',
            36: 'https://i.postimg.cc/gj70X8PH/36.png',
            37: 'https://i.postimg.cc/66bqmJGS/37.png',
            38: 'https://i.postimg.cc/GpRmybZr/38.png',
            39: 'https://i.postimg.cc/SsTS3CR3/39.png',
            40: 'https://i.postimg.cc/V6Gfpn5P/40.png',
            41: 'https://i.postimg.cc/2y1kDyBF/41.png',
            42: 'https://i.postimg.cc/Nj6gYWLR/42.png',
            43: 'https://i.postimg.cc/fbMMbB9T/43.png',
            44: 'https://i.postimg.cc/k5wqRKQ5/44.png',
            45: 'https://i.postimg.cc/vBBMrThK/45.png',
            46: 'https://i.postimg.cc/zDyH5G5N/46.png',
            47: 'https://i.postimg.cc/rwkDSGrh/47.png',
            48: 'https://i.postimg.cc/rwkDSG4V/48.png',
            49: 'https://i.postimg.cc/4xQmwKv4/49.png',
            50: 'https://i.postimg.cc/tgR7cXDc/50.png',
            51: 'https://i.postimg.cc/0yYcfCH6/51.png',
            52: 'https://i.postimg.cc/52Bn3mk3/52.png',
            53: 'https://i.postimg.cc/W1GXn7fw/53.png',
            54: 'https://i.postimg.cc/9QdJpBNJ/54.png',
            55: 'https://i.postimg.cc/mgs0BkvC/55.png',
            56: 'https://i.postimg.cc/LXwb78kg/56.png',
            57: 'https://i.postimg.cc/FzSBQXGW/57.png',
            58: 'https://i.postimg.cc/fWSFdYZ3/58.png',
            59: 'https://i.postimg.cc/g2mB15h6/59.png',
            60: 'https://i.postimg.cc/G3D7trxw/60.png',
            61: 'https://i.postimg.cc/gkqgyD74/61.png',
            62: 'https://i.postimg.cc/x1ft6mDD/62.png',
            63: 'https://i.postimg.cc/MTQDnbRH/63.png',
            64: 'https://i.postimg.cc/rFcJp4w3/64.png',
            65: 'https://i.postimg.cc/9QQYdjZQ/65.png',
            66: 'https://i.postimg.cc/Jh93CDFp/66.png',
            67: 'https://i.postimg.cc/MHwyvkzk/67.png',
            68: 'https://i.postimg.cc/0yj7601b/68.png',
            69: 'https://i.postimg.cc/TwMb48LG/69.png',
            70: 'https://i.postimg.cc/brqtqQ9C/70.png',
            71: 'https://i.postimg.cc/3N9DNdL0/71.png',
            72: 'https://i.postimg.cc/wTfmdRRK/72.png',
            73: 'https://i.postimg.cc/T1kpGBwY/73.png',
            74: 'https://i.postimg.cc/cCDrZPHw/74.png',
            75: 'https://i.postimg.cc/66z7d4hD/75.png',
            76: 'https://i.postimg.cc/SQVXWYrC/76.png',
            77: 'https://i.postimg.cc/50b0zfQH/77.png',
            78: 'https://i.postimg.cc/k4q4S7RX/78.png',
            79: 'https://i.postimg.cc/0QPQS9K0/79.png',
            80: 'https://i.postimg.cc/zB7fS4TS/80.png',
            81: 'https://i.postimg.cc/JzX4dsbz/81.png',
            82: 'https://i.postimg.cc/htmP3X9p/82.png',
            83: 'https://i.postimg.cc/CKHMS9P3/83.png',
            84: 'https://i.postimg.cc/cJM10PkY/84.png',
            85: 'https://i.postimg.cc/jSyt4GbQ/85.png',
            86: 'https://i.postimg.cc/Tw3xG1Wq/86.png',
            87: 'https://i.postimg.cc/FK95gzp8/87.png',
            88: 'https://i.postimg.cc/tgXQtJDQ/88.png',
            89: 'https://i.postimg.cc/hj5kBrnT/89.png',
            90: 'https://i.postimg.cc/9z3s4Qrm/90.png',
            91: 'https://i.postimg.cc/wTLjwt5M/91.png',
            92: 'https://i.postimg.cc/BQHnm85F/92.png',
            93: 'https://i.postimg.cc/x1PTSWFw/93.png',
            94: 'https://i.postimg.cc/43LfYpGq/94.png',
            95: 'https://i.postimg.cc/vHFQxYRD/95.png',
            96: 'https://i.postimg.cc/KvSZ3GXL/96.png',
            97: 'https://i.postimg.cc/6pBtzMpW/97.png',
            98: 'https://i.postimg.cc/2STmtn13/98.png',
            99: 'https://i.postimg.cc/05mvsT65/99.png',
            100: 'https://i.postimg.cc/PrjjrSZq/100.png',
            101: 'https://i.postimg.cc/Hs9CJb4t/101.png',
            102: 'https://i.postimg.cc/h465SsJs/102.png',
            103: 'https://i.postimg.cc/8kjYQ9C3/103.png',
            104: 'https://i.postimg.cc/596rdTtK/104.png',
            105: 'https://i.postimg.cc/nzsGg81f/105.png',
            106: 'https://i.postimg.cc/YSDxd2Q9/106.png',
            107: 'https://i.postimg.cc/0NXCV57k/107.png',
            108: 'https://i.postimg.cc/d17jpM9F/108.png',
            109: 'https://i.postimg.cc/XvPwwH6D/109.png',
            110: 'https://i.postimg.cc/Jh0NHwvj/110.png',
            111: 'https://i.postimg.cc/zfQnntY6/111.png',
            112: 'https://i.postimg.cc/TPsrr7vN/112.png',
            113: 'https://i.postimg.cc/nc1BdctN/113.png',
            114: 'https://i.postimg.cc/FFyLRs1Y/114.png',
            115: 'https://i.postimg.cc/nV4DzcMM/115.png',
            116: 'https://i.postimg.cc/PfWwxrNv/116.png',
            117: 'https://i.postimg.cc/8PwfRKhd/117.png',
            118: 'https://i.postimg.cc/D0nmsLmv/118.png',
            119: 'https://i.postimg.cc/zv7vkvRW/119.png',
            120: 'https://i.postimg.cc/44QYGLFC/120.png',
            121: 'https://i.postimg.cc/gcHxpSBG/121.png',
            122: 'https://i.postimg.cc/TwXPMgV1/122.png',
            123: 'https://i.postimg.cc/zvzX3NPf/123.png',
            124: 'https://i.postimg.cc/zvxDgQ96/124.png',
            125: 'https://i.postimg.cc/XNLYmZpy/125.png',
            126: 'https://i.postimg.cc/zXPXD9wD/126.png',
            127: 'https://i.postimg.cc/0N78fjT9/127.png',
            128: 'https://i.postimg.cc/gJDmC5c5/128.png',
            129: 'https://i.postimg.cc/MHpqqDvM/129.png',
            130: 'https://i.postimg.cc/h42KMH59/130.png',
            131: 'https://i.postimg.cc/RZH9SqVg/131.png',
            132: 'https://i.postimg.cc/wv0Yfm0m/132.png',
            133: 'https://i.postimg.cc/qqFV0HP1/133.png',
            134: 'https://i.postimg.cc/XYdSMhQD/134.png',
            135: 'https://i.postimg.cc/x8h7hyHj/135.png',
            136: 'https://i.postimg.cc/SKkPBKXm/136.png',
            137: 'https://i.postimg.cc/s2mLsRST/137.png',
            138: 'https://i.postimg.cc/SQHkwWm8/138.png',
            139: 'https://i.postimg.cc/9QY2RKZ1/139.png',
            140: 'https://i.postimg.cc/vZ24x4WY/140.png',
            141: 'https://i.postimg.cc/bYSjHskK/141.png',
            142: 'https://i.postimg.cc/cL0ySh21/142.png',
            143: 'https://i.postimg.cc/Z5HkK3zB/143.png',
            144: 'https://i.postimg.cc/Wb96Nbfc/144.png',
            145: 'https://i.postimg.cc/DwwWzrby/145.png',
            146: 'https://i.postimg.cc/59g8g2JL/146.png',
            147: 'https://i.postimg.cc/prRYT9Hn/147.png',
            148: 'https://i.postimg.cc/fRqVSVxw/148.png',
            149: 'https://i.postimg.cc/hGJfLKr5/149.png',
            150: 'https://i.postimg.cc/3Nf4TWJH/150.png',
            151: 'https://i.postimg.cc/VkkRcbf0/151.png',
            152: 'https://i.postimg.cc/y88PzS1k/152.png',
            153: 'https://i.postimg.cc/MppD8j6q/153.png',
            154: 'https://i.postimg.cc/9QQpjqm4/154.png',
            155: 'https://i.postimg.cc/h48bz0hT/155.png',
            156: 'https://i.postimg.cc/tRdtZz73/156.png',
            157: 'https://i.postimg.cc/TYRjrWWQ/157.png',
            158: 'https://i.postimg.cc/BQq5x11w/158.png',
            159: 'https://i.postimg.cc/xCDMqk2m/159.png',
            160: 'https://i.postimg.cc/vBFfD1s7/160.png',
            161: 'https://i.postimg.cc/3RXpGKr7/161.png',
            162: 'https://i.postimg.cc/D07Gdtmn/162.png',
            163: 'https://i.postimg.cc/3JJpy5sH/163.png',
            164: 'https://i.postimg.cc/zXXWLZs8/164.png',
            165: 'https://i.postimg.cc/yYQRcpKJ/165.png',
            166: 'https://i.postimg.cc/ZK7Npsmp/166.png',
            167: 'https://i.postimg.cc/PxQpx2KL/167.png',
            168: 'https://i.postimg.cc/G2x82qz4/168.png',
            169: 'https://i.postimg.cc/RhC3nKbd/169.png',
            170: 'https://i.postimg.cc/cC1K8w5M/170.png',
            171: 'https://i.postimg.cc/qBQ6HDz2/171.png',
            172: 'https://i.postimg.cc/HshJVJ0J/172.png',
            173: 'https://i.postimg.cc/Hk8r5p3P/173.png',
            174: 'https://i.postimg.cc/FHkYc9GC/174.png',
            175: 'https://i.postimg.cc/cJQ69Xp4/175.png',
            176: 'https://i.postimg.cc/1tBXP454/176.png',
            177: 'https://i.postimg.cc/3Nbw46vS/177.png',
            178: 'https://i.postimg.cc/brvJv8sM/178.png',
            179: 'https://i.postimg.cc/CLz5TF3X/179.png',
            180: 'https://i.postimg.cc/9Q9f0LFx/180.png',
            181: 'https://i.postimg.cc/s2Rgh5M9/181.png',
            182: 'https://i.postimg.cc/rpCFCz44/182.png',
            183: 'https://i.postimg.cc/8CBPBsvy/183.png',
            184: 'https://i.postimg.cc/0j382wT4/184.png',
            185: 'https://i.postimg.cc/15nm7v6S/185.png',
            186: 'https://i.postimg.cc/ncjFS377/186.png',
            187: 'https://i.postimg.cc/ncyHyqYQ/187.png',
            188: 'https://i.postimg.cc/Prgtg1zF/188.png',
            189: 'https://i.postimg.cc/LX8RtD22/189.png',
            190: 'https://i.postimg.cc/nzhZ42ph/190.png',
            191: 'https://i.postimg.cc/V6ZwDtkJ/191.png',
            192: 'https://i.postimg.cc/pTcvqjLn/192.png',
            193: 'https://i.postimg.cc/tRfy6Ffj/193.png',
            194: 'https://i.postimg.cc/CxCV9XK8/194.png',
            195: 'https://i.postimg.cc/pLQt34d8/195.png',
            196: 'https://i.postimg.cc/Jh1W8xyc/196.png',
            197: 'https://i.postimg.cc/xdtV1mHP/197.png',
            198: 'https://i.postimg.cc/ZnvGHDgb/198.png',
            199: 'https://i.postimg.cc/bdXKB9cH/199.png',
            200: 'https://i.postimg.cc/XNZqtN60/200.png',
            201: 'https://i.postimg.cc/KYXD3p78/201.png',
            202: 'https://i.postimg.cc/Nj2xMvXy/202.png',
            203: 'https://i.postimg.cc/43CQH2vK/203.png',
            204: 'https://i.postimg.cc/mrxy1p32/204.png',
            205: 'https://i.postimg.cc/tJmhqBCP/205.png',
            206: 'https://i.postimg.cc/ryhGNwCM/206.png',
            207: 'https://i.postimg.cc/J7T35zcW/207.png',
            208: 'https://i.postimg.cc/J7T35zc4/208.png',
            209: 'https://i.postimg.cc/yYtF2pGK/209.png',
            210: 'https://i.postimg.cc/wBdDjyHf/210.png',
            211: 'https://i.postimg.cc/6QLn2WpB/211.png',
            212: 'https://i.postimg.cc/6QLn2Wp3/212.png',
            213: 'https://i.postimg.cc/7hb2WSMY/213.png',
            214: 'https://i.postimg.cc/J0gkVtPX/214.png',
            215: 'https://i.postimg.cc/5NYz5q2q/215.png',
            216: 'https://i.postimg.cc/9FR9PtQx/216.png',
            217: 'https://i.postimg.cc/Mp1jN6RD/217.png',
            218: 'https://i.postimg.cc/LsRZMc3d/218.png',
            219: 'https://i.postimg.cc/JnzDsjF0/219.png',
            220: 'https://i.postimg.cc/mDgzP7nM/220.png',
            221: 'https://i.postimg.cc/HnJr2ddb/221.png',
            222: 'https://i.postimg.cc/3NykBYYg/222.png',
            223: 'https://i.postimg.cc/G3N8p8xL/223.png',
            224: 'https://i.postimg.cc/dQXk0kjn/224.png',
            225: 'https://i.postimg.cc/VNY5hjm7/225.png',
            226: 'https://i.postimg.cc/9fWzkGCk/226.png',
            227: 'https://i.postimg.cc/5txjrwf4/227.png',
            228: 'https://i.postimg.cc/bv3dfsvq/228.png',
            229: 'https://i.postimg.cc/ZRQR0232/229.png',
            230: 'https://i.postimg.cc/VsS94c7J/230.png',
            231: 'https://i.postimg.cc/1RLGjYTp/231.png',
            232: 'https://i.postimg.cc/FF2yBnqT/232.png',
            233: 'https://i.postimg.cc/WbgGLwcP/233.png',
            234: 'https://i.postimg.cc/Gmjv932R/234.png',
            235: 'https://i.postimg.cc/pdG8Y0zc/235.png',
            236: 'https://i.postimg.cc/DzjsdCLB/236.png',
            237: 'https://i.postimg.cc/nr7Dxp50/237.png',
            238: 'https://i.postimg.cc/L4ZfL3Xf/238.png',
            239: 'https://i.postimg.cc/SxmM00rb/239.png',
            240: 'https://i.postimg.cc/7Zq2vvN3/240.png',
            241: 'https://i.postimg.cc/VNVrbJPx/241.png',
            242: 'https://i.postimg.cc/d1Z7RJqQ/242.png',
            243: 'https://i.postimg.cc/T2mLp27m/243.png',
            244: 'https://i.postimg.cc/RCf6NCsT/244.png',
            245: 'https://i.postimg.cc/FHP12Yzs/245.png',
            246: 'https://i.postimg.cc/MGvXxzfj/246.png',
            247: 'https://i.postimg.cc/nzmzjTkx/247.png',
            248: 'https://i.postimg.cc/sxR2pS6P/248.png',
            249: 'https://i.postimg.cc/x8y1gCBN/249.png',
            250: 'https://i.postimg.cc/pVDrPGrB/250.png',
            251: 'https://i.postimg.cc/ZRLMYzNk/251.png',
            252: 'https://i.postimg.cc/qRG5BH39/252.png',
            253: 'https://i.postimg.cc/Kz5HchMr/253.png',
            254: 'https://i.postimg.cc/ZRLMYzdM/254.png',
            255: 'https://i.postimg.cc/zfZtnGw9/255.png',
            256: 'https://i.postimg.cc/zBpxZwss/256.png',
            257: 'https://i.postimg.cc/Vv6DYr16/257.png',
            258: 'https://i.postimg.cc/Hnh3jYs7/258.png',
            259: 'https://i.postimg.cc/pVGssZYv/259.png',
            260: 'https://i.postimg.cc/D08d99dQ/260.png',
            261: 'https://i.postimg.cc/vmhrcY0T/261.png',
            262: 'https://i.postimg.cc/Y9yQzXKr/262.png',
            263: 'https://i.postimg.cc/KzYnT6WW/263.png',
            264: 'https://i.postimg.cc/6q2njdtM/264.png',
            265: 'https://i.postimg.cc/B6y1KXHs/265.png',
            266: 'https://i.postimg.cc/sg90yZZx/266.png',
            267: 'https://i.postimg.cc/7LKsJ89x/267.png',
            268: 'https://i.postimg.cc/PqXVqrmg/268.png',
            269: 'https://i.postimg.cc/ZYB7nQdC/269.png',
            270: 'https://i.postimg.cc/Y2WRMm5N/270.png',
            271: 'https://i.postimg.cc/3xKFXfdx/271.png',
            272: 'https://i.postimg.cc/vZQtr2c5/272.png',
            273: 'https://i.postimg.cc/RZML7pNG/273.png',
            274: 'https://i.postimg.cc/6QqVS7V5/274.png',
            275: 'https://i.postimg.cc/SR6c8c4f/275.png',
            276: 'https://i.postimg.cc/rs15W5Tf/276.png',
            277: 'https://i.postimg.cc/T2gVZvbp/277.png',
            278: 'https://i.postimg.cc/59LBZWzL/278.png',
            279: 'https://i.postimg.cc/RZsKcMkk/279.png',
            280: 'https://i.postimg.cc/T1JWhGqX/280.png',
            281: 'https://i.postimg.cc/8kRvZB8t/281.png',
            282: 'https://i.postimg.cc/3J3vV47Z/282.png',
            283: 'https://i.postimg.cc/Yq8WHrCh/283.png',
            284: 'https://i.postimg.cc/J0MGfvwh/284.png',
            285: 'https://i.postimg.cc/2j7qQkvs/285.png',
            286: 'https://i.postimg.cc/Kvc1Q6Dk/286.png',
            287: 'https://i.postimg.cc/g2nnb378/287.png',
            288: 'https://i.postimg.cc/d1m0j67v/288.png',
            289: 'https://i.postimg.cc/8PCCLhNq/289.png',
            290: 'https://i.postimg.cc/sD225p37/290.png',
            291: 'https://i.postimg.cc/5Nk2g6tm/291.png',
            292: 'https://i.postimg.cc/vZgHNb1j/292.png',
            293: 'https://i.postimg.cc/6309vQSM/293.png',
            294: 'https://i.postimg.cc/RhZvQB5R/294.png',
            295: 'https://i.postimg.cc/8czTBSQ3/295.png',
            296: 'https://i.postimg.cc/MHpzbSJ2/296.png',
            297: 'https://i.postimg.cc/HW6YWVbx/297.png',
            298: 'https://i.postimg.cc/MGJx3RJP/298.png',
            299: 'https://i.postimg.cc/rpGTBmqQ/299.png',
            300: 'https://i.postimg.cc/q7crPRpc/300.png',
            301: 'https://i.postimg.cc/bwJ3XFpP/301.png',
            302: 'https://i.postimg.cc/8z5t8nNc/302.png',
            303: 'https://i.postimg.cc/Bn6MWw46/303.png',
            304: 'https://i.postimg.cc/y8bn7X8H/304.png',
            305: 'https://i.postimg.cc/526qKYSM/305.png',
            306: 'https://i.postimg.cc/fRJjqtfw/306.png',
            307: 'https://i.postimg.cc/NjS83sdy/307.png',
            308: 'https://i.postimg.cc/CxXC3hck/308.png',
            309: 'https://i.postimg.cc/y6jmVXfY/309.png',
            310: 'https://i.postimg.cc/BnLHBWJH/310.png',
            311: 'https://i.postimg.cc/8z2WyyC7/311.png',
            312: 'https://i.postimg.cc/wjCJWWBD/312.png',
            313: 'https://i.postimg.cc/mr79KQz4/313.png',
            314: 'https://i.postimg.cc/BZmFWZ6b/314.png',
            315: 'https://i.postimg.cc/Fs1LhtdV/315.png',
            316: 'https://i.postimg.cc/fTF0LHmg/316.png',
            317: 'https://i.postimg.cc/L67ZXyLG/317.png',
            318: 'https://i.postimg.cc/DwX4bqcr/318.png',
            319: 'https://i.postimg.cc/j21CD5wh/319.png',
            320: 'https://i.postimg.cc/hvYhXjzb/320.png',
            321: 'https://i.postimg.cc/prSymThS/321.png',
            322: 'https://i.postimg.cc/BQ8Xdxk2/322.png',
            323: 'https://i.postimg.cc/j5gS15XV/323.png',
            324: 'https://i.postimg.cc/j2DSYbgN/324.png',
            325: 'https://i.postimg.cc/Y0TqpsZ5/325.png',
            326: 'https://i.postimg.cc/qBF7XNq7/326.png',
            327: 'https://i.postimg.cc/q7QJtRWG/327.png',
            328: 'https://i.postimg.cc/mZKHZXYh/328.png',
            329: 'https://i.postimg.cc/jSbnPD38/329.png',
            330: 'https://i.postimg.cc/JzLHZsY3/330.png',
            331: 'https://i.postimg.cc/tTwYTJVr/331.png',
            332: 'https://i.postimg.cc/T3fhhZpd/332.png',
            333: 'https://i.postimg.cc/zG8339VX/333.png',
            334: 'https://i.postimg.cc/9Qb09J7W/334.png',
            335: 'https://i.postimg.cc/jjj54PHM/335.png',
            336: 'https://i.postimg.cc/fTjR4B5f/336.png',
            337: 'https://i.postimg.cc/28FSp2TQ/337.png',
            338: 'https://i.postimg.cc/02dygcZd/338.png',
            339: 'https://i.postimg.cc/GmLhbGS5/339.png',
            340: 'https://i.postimg.cc/9fSWPSXK/340.png',
            341: 'https://i.postimg.cc/c4m0k64j/341.png',
            342: 'https://i.postimg.cc/8zzD2D7W/342.png',
            343: 'https://i.postimg.cc/jS3KK9fL/343.png',
            344: 'https://i.postimg.cc/MGcwGD0h/344.png',
            345: 'https://i.postimg.cc/X7V053cz/345.png',
            346: 'https://i.postimg.cc/FHz5PZ6h/346.png',
            347: 'https://i.postimg.cc/3xN5LBq0/347.png',
            348: 'https://i.postimg.cc/vZKRCnR1/348.png',
            349: 'https://i.postimg.cc/W3RB1P1D/349.png',
            350: 'https://i.postimg.cc/7hwjSM7w/350.png',
            351: 'https://i.postimg.cc/sgzdzz1j/351.png',
            352: 'https://i.postimg.cc/vZyFyyDm/352.png',
            353: 'https://i.postimg.cc/x1QDQQqQ/353.png',
            354: 'https://i.postimg.cc/NjtqttLj/354.png',
            355: 'https://i.postimg.cc/vBkkNFpr/355.png',
            356: 'https://i.postimg.cc/X7MtKWK6/356.png',
            357: 'https://i.postimg.cc/dtMgRF2W/357.png',
            358: 'https://i.postimg.cc/hP96pYs6/358.png',
            359: 'https://i.postimg.cc/Mp548jhg/359.png',
            360: 'https://i.postimg.cc/sgj6KgvL/360.png',
            361: 'https://i.postimg.cc/Cxcv2pqm/361.png',
            362: 'https://i.postimg.cc/vZ0PKwnG/362.png',
            363: 'https://i.postimg.cc/HLjSDv0d/363.png',
            364: 'https://i.postimg.cc/zGG7K2cW/364.png',
            365: 'https://i.postimg.cc/MGcYrMxX/365.png',
            366: 'https://i.postimg.cc/6QDhsW5Y/366.png',
            367: 'https://i.postimg.cc/bJk9p7Zh/367.png',
            368: 'https://i.postimg.cc/GmtPH8Bb/368.png',
            369: 'https://i.postimg.cc/SsFcTgg4/369.png',
            370: 'https://i.postimg.cc/63rnDCPG/370.png',
            371: 'https://i.postimg.cc/MHzVxv2w/371.png',
            372: 'https://i.postimg.cc/Cx985vT4/372.png',
            373: 'https://i.postimg.cc/50VFq6tX/373.png',
            374: 'https://i.postimg.cc/sX4GnsB7/374.png',
            375: 'https://i.postimg.cc/Hx98SdJv/375.png',
            376: 'https://i.postimg.cc/CL1nNywK/376.png',
            377: 'https://i.postimg.cc/FHkfMjdH/377.png',
            378: 'https://i.postimg.cc/6Qd83tfH/378.png',
            379: 'https://i.postimg.cc/7Lg56wNr/379.png',
            380: 'https://i.postimg.cc/W38tG8CR/380.png',
            381: 'https://i.postimg.cc/bNWr9s66/381.png',
            382: 'https://i.postimg.cc/N0w0ZZv2/382.png',
            383: 'https://i.postimg.cc/XvcvWxnm/383.png',
            384: 'https://i.postimg.cc/k4Jgg84F/384.png',
            385: 'https://i.postimg.cc/PfF5dCkH/385.png',
            386: 'https://i.postimg.cc/q70k1n2G/386.png',
            387: 'https://i.postimg.cc/43ZJWtzX/387.png',
            388: 'https://i.postimg.cc/HxkTggZ6/388.png',
            389: 'https://i.postimg.cc/nzSpVPNz/389.png',
            390: 'https://i.postimg.cc/2SNm5v9n/390.png',
            391: 'https://i.postimg.cc/3xjh0Rz9/391.png',
            392: 'https://i.postimg.cc/Vk9w0622/392.png',
            393: 'https://i.postimg.cc/W42vGVPf/393.png',
            394: 'https://i.postimg.cc/8sQ8jQ4g/394.png',
            395: 'https://i.postimg.cc/MZhXyn3h/395.png',
            396: 'https://i.postimg.cc/MpYT2dZJ/396.png',
            397: 'https://i.postimg.cc/0yvQBLsT/397.png',
            398: 'https://i.postimg.cc/hGPGSThd/398.png',
            399: 'https://i.postimg.cc/k51gDGtv/399.png',
            400: 'https://i.postimg.cc/wv1TNzhP/400.png',
            401: 'https://i.postimg.cc/cLPDWMFB/401.png',
            402: 'https://i.postimg.cc/x1BsQy64/402.png',
            403: 'https://i.postimg.cc/L8GySBxC/403.png',
            404: 'https://i.postimg.cc/P506HzSc/404.png',
            405: 'https://i.postimg.cc/Gh5KPxnt/405.png',
            406: 'https://i.postimg.cc/TY40jJv3/406.png',
            407: 'https://i.postimg.cc/TY40jJvw/407.png',
            408: 'https://i.postimg.cc/4xH5WHXx/408.png',
            409: 'https://i.postimg.cc/g0vKW9Xx/409.png',
            410: 'https://i.postimg.cc/MZsmxmTm/410.png',
            411: 'https://i.postimg.cc/zDdF5FB7/411.png',
            412: 'https://i.postimg.cc/tRrNyNTS/412.png',
            413: 'https://i.postimg.cc/02bdNKK5/413.png',
            414: 'https://i.postimg.cc/QCV5VvtK/414.png',
            415: 'https://i.postimg.cc/XNDdtNHD/415.png',
            416: 'https://i.postimg.cc/661nF6jv/416.png',
            417: 'https://i.postimg.cc/y6rc26p4/417.png',
            418: 'https://i.postimg.cc/MGDj5zfb/418.png',
            419: 'https://i.postimg.cc/HWK8BZjg/419.png',
            420: 'https://i.postimg.cc/sDhQ8YZV/420.png',
            421: 'https://i.postimg.cc/qM3hYs69/421.png',
            422: 'https://i.postimg.cc/52WYMXw3/422.png',
            423: 'https://i.postimg.cc/5jd01rQZ/423.png',
            424: 'https://i.postimg.cc/XXSJ3PBR/424.png',
            425: 'https://i.postimg.cc/fW3fz006/425.png',
            426: 'https://i.postimg.cc/Y24zrmW2/426.png',
            427: 'https://i.postimg.cc/Y9vYCJjy/427.png',
            428: 'https://i.postimg.cc/NjbH7gH2/428.png',
            429: 'https://i.postimg.cc/MptQbWQX/429.png',
            430: 'https://i.postimg.cc/y8nZXVZS/430.png',
            431: 'https://i.postimg.cc/yNb3tvnH/431.png',
            432: 'https://i.postimg.cc/TPppVnGh/432.png',
            433: 'https://i.postimg.cc/HxMnKHVz/433.png',
            434: 'https://i.postimg.cc/LXP57Rnw/434.png',
            435: 'https://i.postimg.cc/qqdqHYKK/435.png',
            436: 'https://i.postimg.cc/PJhXRDGq/436.png',
            437: 'https://i.postimg.cc/xTfjGLyt/437.png',
            438: 'https://i.postimg.cc/28kjdnFw/438.png',
            439: 'https://i.postimg.cc/15mR0DcL/439.png',
            440: 'https://i.postimg.cc/Sx5yp3Fb/440.png',
            441: 'https://i.postimg.cc/gcDm0nFr/441.png',
            442: 'https://i.postimg.cc/BZg4vX9B/442.png',
            443: 'https://i.postimg.cc/dQBw0LPS/443.png',
            444: 'https://i.postimg.cc/BQ73xkvQ/444.png',
            445: 'https://i.postimg.cc/D0C9P4nP/445.png',
            446: 'https://i.postimg.cc/yYGqJRfh/446.png',
            447: 'https://i.postimg.cc/sgGk5285/447.png',
            448: 'https://i.postimg.cc/2SLsn5J9/448.png',
            449: 'https://i.postimg.cc/mk6nHxyn/449.png',
            450: 'https://i.postimg.cc/TPX4mJnW/450.png',
            451: 'https://i.postimg.cc/0NdHCKC0/451.png',
            452: 'https://i.postimg.cc/zfSPkHkk/452.png',
            453: 'https://i.postimg.cc/PxXVVf3C/453.png',
            454: 'https://i.postimg.cc/RZwPMJ2q/454.png',
            455: 'https://i.postimg.cc/vmM0DHd5/455.png',
            456: 'https://i.postimg.cc/yNBLWYzy/456.png',
            457: 'https://i.postimg.cc/BvgMF9qV/457.png',
            458: 'https://i.postimg.cc/x8kRBXK1/458.png',
            459: 'https://i.postimg.cc/XqT8Wn8f/459.png',
            460: 'https://i.postimg.cc/8cqHGTHb/460.png',
            461: 'https://i.postimg.cc/Mp4jr99W/461.png',
            462: 'https://i.postimg.cc/FHqJnTT5/462.png',
            463: 'https://i.postimg.cc/qvg3LPxJ/463.png',
            464: 'https://i.postimg.cc/8z3rnZZP/464.png',
            465: 'https://i.postimg.cc/7ZC57gqP/465.png',
            466: 'https://i.postimg.cc/8zF7WhT1/466.png',
            467: 'https://i.postimg.cc/YCJhxhSk/467.png',
            468: 'https://i.postimg.cc/SxXn8Wms/468.png',
            469: 'https://i.postimg.cc/908fwfSV/469.png',
            470: 'https://i.postimg.cc/CxfKdSs2/470.png',
            471: 'https://i.postimg.cc/m2nDbt7f/471.png',
            472: 'https://i.postimg.cc/W4L1kC93/472.png',
            473: 'https://i.postimg.cc/rmqyhW2G/473.png',
            474: 'https://i.postimg.cc/6qm95m2R/474.png',
            475: 'https://i.postimg.cc/fW2WKJ2N/475.png',
            476: 'https://i.postimg.cc/59793679/476.png',
            477: 'https://i.postimg.cc/Fsw9MwQt/477.png',
            478: 'https://i.postimg.cc/q7x4CR6T/478.png',
            479: 'https://i.postimg.cc/B6Zs502c/479.png',
            480: 'https://i.postimg.cc/cHDWXbc3/480.png',
            481: 'https://i.postimg.cc/sxvr846g/481.png',
            482: 'https://i.postimg.cc/jSzrG5XH/482.png',
            483: 'https://i.postimg.cc/CMXT5Dr8/483.png',
            484: 'https://i.postimg.cc/KcwSjLpg/484.png',
            485: 'https://i.postimg.cc/52WhqJV6/485.png',
            486: 'https://i.postimg.cc/yNV2tTW8/486.png',
            487: 'https://i.postimg.cc/tRKqfLbq/487.png',
            488: 'https://i.postimg.cc/KvtGyJcM/488.png',
            489: 'https://i.postimg.cc/JhzMZ8Nm/489.png',
            490: 'https://i.postimg.cc/259mxtGx/490.png',
            491: 'https://i.postimg.cc/XJyMkYpN/491.png',
            492: 'https://i.postimg.cc/NMrhkj5h/492.png',
            493: 'https://i.postimg.cc/sxptbHY8/493.png',
            494: 'https://i.postimg.cc/gkHCD5kw/494.png',
            495: 'https://i.postimg.cc/BZxkSyD4/495.png',
            496: 'https://i.postimg.cc/TYfSp9qq/496.png',
            497: 'https://i.postimg.cc/jdc1N7Zw/497.png',
            498: 'https://i.postimg.cc/SNdP8MD5/498.png',
            499: 'https://i.postimg.cc/SRqZYS91/499.png',
            500: 'https://i.postimg.cc/7hDBJH7w/500.png',
            501: 'https://i.postimg.cc/KjN0n6r4/501.png',
            502: 'https://i.postimg.cc/44b2kckx/502.png',
            503: 'https://i.postimg.cc/BvKNhLBn/503.png',
            504: 'https://i.postimg.cc/ZRPHSGQp/504.png',
            505: 'https://i.postimg.cc/BbqgQh93/505.png',
            506: 'https://i.postimg.cc/1XJKgps5/506.png',
            507: 'https://i.postimg.cc/fLs7BHbK/507.png',
            508: 'https://i.postimg.cc/sXzPwn27/508.png',
            509: 'https://i.postimg.cc/RFT78c31/509.png',
            510: 'https://i.postimg.cc/sXJY8pBw/510.png',
            511: 'https://i.postimg.cc/g26vd9X3/511.png',
            512: 'https://i.postimg.cc/gjTZF4Gy/512.png',
            513: 'https://i.postimg.cc/NGJTHGRL/513.png',
            514: 'https://i.postimg.cc/Y2ngW2Q0/514.png',
            515: 'https://i.postimg.cc/R0BnBWxp/515.png',
            516: 'https://i.postimg.cc/Sx0n6nRk/516.png',
            517: 'https://i.postimg.cc/Zq40QX61/517.png',
            518: 'https://i.postimg.cc/k5qDHLxX/518.png',
            519: 'https://i.postimg.cc/ydNx19p4/519.png',
            520: 'https://i.postimg.cc/Kcwjb1nt/520.png',
            521: 'https://i.postimg.cc/N0dGzFsK/521.png',
            522: 'https://i.postimg.cc/MTXZ2wHr/522.png',
            523: 'https://i.postimg.cc/YjBtWm35/523.png',
            524: 'https://i.postimg.cc/g2D6GYc8/524.png',
            525: 'https://i.postimg.cc/BZKLX5Zp/525.png',
            526: 'https://i.postimg.cc/VLPSMSdm/526.png',
            527: 'https://i.postimg.cc/NfvyTy58/527.png',
            528: 'https://i.postimg.cc/T3ChZCQg/528.png',
            529: 'https://i.postimg.cc/FRJRkmvn/529.png',
            530: 'https://i.postimg.cc/wM8BhPT9/530.png',
            531: 'https://i.postimg.cc/GpCz537d/531.png',
            532: 'https://i.postimg.cc/52vngQ32/532.png',
            533: 'https://i.postimg.cc/fbN5rW2Z/533.png',
            534: 'https://i.postimg.cc/JhLK276r/534.png',
            535: 'https://i.postimg.cc/KYxr5qjZ/535.png',
            536: 'https://i.postimg.cc/2S47hRk1/536.png',
            537: 'https://i.postimg.cc/nLpY1Rrs/537.png',
            538: 'https://i.postimg.cc/wBgckfMR/538.png',
            539: 'https://i.postimg.cc/44q60Nnm/539.png',
            540: 'https://i.postimg.cc/q71nxpWQ/540.png',
            541: 'https://i.postimg.cc/63TZHDX7/541.png',
            542: 'https://i.postimg.cc/rmbr7QVd/542.png',
            543: 'https://i.postimg.cc/HWRRdyBN/543.png',
            544: 'https://i.postimg.cc/g2qTVBdH/544.png',
            545: 'https://i.postimg.cc/GmJ5FSdw/545.png',
            546: 'https://i.postimg.cc/3xCcXbYx/546.png',
            547: 'https://i.postimg.cc/50G74hqY/547.png',
            548: 'https://i.postimg.cc/8kJXKCNd/548.png',
            549: 'https://i.postimg.cc/HsbZmPJV/549.png',
            550: 'https://i.postimg.cc/VLXGwHSq/550.png',
            551: 'https://i.postimg.cc/43xBzfWz/551.png',
            552: 'https://i.postimg.cc/QNTSgnqG/552.png',
            553: 'https://i.postimg.cc/q7qxNm7D/553.png',
            554: 'https://i.postimg.cc/wBMQ1WBG/554.png',
            555: 'https://i.postimg.cc/s2L97pQs/555.png',
            556: 'https://i.postimg.cc/RCKQJJv1/556.png',
            557: 'https://i.postimg.cc/BQJD8hYB/557.png',
            558: 'https://i.postimg.cc/NjMHDKwF/558.png',
            559: 'https://i.postimg.cc/jjnJVB58/559.png',
            560: 'https://i.postimg.cc/HxG8T38H/560.png',
            561: 'https://i.postimg.cc/xdmqpHxh/561.png',
            562: 'https://i.postimg.cc/hv2GQ0vp/562.png',
            563: 'https://i.postimg.cc/mr72y4hL/563.png',
            564: 'https://i.postimg.cc/mkgL4Fjk/564.png',
            565: 'https://i.postimg.cc/j5sK6JGN/565.png',
            566: 'https://i.postimg.cc/hvvB6R4Q/566.png',
            567: 'https://i.postimg.cc/SK4pqMQB/567.png',
            568: 'https://i.postimg.cc/GpjnpmH8/568.png',
            569: 'https://i.postimg.cc/3xMsCvGN/569.png',
            570: 'https://i.postimg.cc/FHj2PHb2/570.png',
            571: 'https://i.postimg.cc/DfSfx1SH/571.png',
            572: 'https://i.postimg.cc/bwhzYM3B/572.png',
            573: 'https://i.postimg.cc/DZHT9YWV/573.png',
            574: 'https://i.postimg.cc/zDH5C5Qs/574.png',
            575: 'https://i.postimg.cc/0NN1bqmd/575.png',
            576: 'https://i.postimg.cc/4d7CQbWy/576.png',
            577: 'https://i.postimg.cc/3wNz3F5Z/577.png',
            578: 'https://i.postimg.cc/Hx7KyWLc/578.png',
            579: 'https://i.postimg.cc/NjJPC29y/579.png',
            580: 'https://i.postimg.cc/s2MHkf5r/580.png',
            581: 'https://i.postimg.cc/KcPpSH38/581.png',
            582: 'https://i.postimg.cc/yY7QVy0n/582.png',
            583: 'https://i.postimg.cc/R0JGPszC/583.png',
            584: 'https://i.postimg.cc/264GY16F/584.png',
            585: 'https://i.postimg.cc/dVL91H39/585.png',
            586: 'https://i.postimg.cc/K8wDgPgv/586.png',
            587: 'https://i.postimg.cc/v8h7vF6W/587.png',
            588: 'https://i.postimg.cc/c1h7cy89/588.png',
            589: 'https://i.postimg.cc/k498xfMr/589.png',
            590: 'https://i.postimg.cc/ZRcNjp0S/590.png',
            591: 'https://i.postimg.cc/N0vrcpr3/591.png',
            592: 'https://i.postimg.cc/vmw6s36p/592.png',
            593: 'https://i.postimg.cc/LXNqjS0P/593.png',
            594: 'https://i.postimg.cc/Hnnr2Nf4/594.png',
            595: 'https://i.postimg.cc/NFK0THXw/595.png',
            596: 'https://i.postimg.cc/0jzNmwSx/596.png',
            597: 'https://i.postimg.cc/bN2Jw18g/597.png',
            598: 'https://i.postimg.cc/0yYypxbh/598.png',
            599: 'https://i.postimg.cc/8CkfcsZz/599.png',
            600: 'https://i.postimg.cc/tgrZxycJ/600.png',
            601: 'https://i.postimg.cc/yxRktR8J/601.png',
            602: 'https://i.postimg.cc/DZHSx6n7/602.png',
            603: 'https://i.postimg.cc/L82nQnKF/603.png',
            604: 'https://i.postimg.cc/QdhHYHGM/604.png'
        };
        return urls;
    }

    loadUserStates() {
        try {
            if (fs.existsSync(STATES_FILE)) {
                const data = fs.readFileSync(STATES_FILE, 'utf8');
                return JSON.parse(data);
            }
        } catch (error) {
            console.error('Error loading user states:', error);
        }
        return {};
    }

    saveUserStates() {
        try {
            fs.writeFileSync(STATES_FILE, JSON.stringify(this.userStates, null, 2));
        } catch (error) {
            console.error('Error saving user states:', error);
        }
    }

    getUserState(userId) {
        if (!this.userStates[userId]) {
            this.userStates[userId] = { currentPage: 1 };
            this.saveUserStates();
        }
        return this.userStates[userId];
    }

    setUserPage(userId, page) {
        if (page < 1) page = 1;
        if (page > this.totalPages) page = this.totalPages;
        
        this.getUserState(userId);
        this.userStates[userId].currentPage = page;
        this.saveUserStates();
    }

    async checkRolePermission(member) {
        return member.roles.cache.has(this.requiredRoleId);
    }

    createInitialEmbed() {
        const embed = new EmbedBuilder()
            .setTitle('القرآن الكريم 📖')
            .setDescription('يمكنك عرض صفحات المصحف الشريف **( 1 ~ 604 )** عبر أحد الخيارات:\n\n• **بحث عن صفحة**: اكتب رقم الصفحة مباشرة\n• **الفهرس**: انتقل إلى صفحات الفهرس')
            .setImage('https://i.postimg.cc/Zqqf781f/Picsart-25-12-18-15-44-57-925.jpg')
            .setFooter({ text: 'صفحات المصحف الشريف.' })
            .setColor("99aab5");

        const searchButton = new ButtonBuilder()
            .setCustomId('quran_show_modal')
            .setLabel('بحث عن صفحة')
            .setEmoji('🔎')
            .setStyle(ButtonStyle.Primary);

        const indexButton = new ButtonBuilder()
            .setCustomId('quran_show_index')
            .setLabel('الفهرس')
            .setEmoji('📜')
            .setStyle(ButtonStyle.Secondary);

        const row = new ActionRowBuilder().addComponents(searchButton, indexButton);

        return { embed, row };
    }

    createPageEmbed(userId) {
        const userState = this.getUserState(userId);
        const page = userState.currentPage;
        
        const embed = new EmbedBuilder()
            .setTitle(`صفحة القرآن الكريم **(${page} / ${this.totalPages})**`)
            .setImage(this.pageUrls[page])
            .setFooter({ text: `(${page}) / ${this.totalPages}` })
            .setColor(0x2E8B57);

        const prevButton = new ButtonBuilder()
            .setCustomId('quran_prev_page')
            .setEmoji('◀️')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page <= 1);

        const nextButton = new ButtonBuilder()
            .setCustomId('quran_next_page')
            .setEmoji('▶️')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page >= this.totalPages);

        const row = new ActionRowBuilder().addComponents(prevButton, nextButton);

        return { embed, row };
    }

    createPageModal() {
        const modal = new ModalBuilder()
            .setCustomId('quran_page_modal')
            .setTitle('أدخل رقم صفحة القرآن الكريم');

        const pageInput = new TextInputBuilder()
            .setCustomId('page_number')
            .setLabel('رقم الصفحة (1 إلى 604)')
            .setStyle(TextInputStyle.Short)
            .setMinLength(1)
            .setMaxLength(3)
            .setPlaceholder('أدخل رقم الصفحة')
            .setRequired(true);

        const row = new ActionRowBuilder().addComponents(pageInput);
        modal.addComponents(row);

        return modal;
    }

    createIndexEmbed() {
        const embed = new EmbedBuilder()
            .setTitle('فهرس المصحف الشريف')
            .setDescription('الصفحات 1 ~ 604')
            .setImage('https://i.postimg.cc/B6gmFjnx/tnzyl.png')
            .setFooter({ text: 'مصحف المدينة المنورة 📖' })
            .setColor(0x2E8B57);

        return { embed };
    }

    async handleCommand(message) {
        if (!message.member.permissions.has('Administrator')) {
            return message.reply({ content: '❌ | تحتاج إلى صلاحية Administrator لاستخدام هذا الأمر!', ephemeral: true });
        }

        try {
            await message.delete();
        } catch (error) {
            console.error('Error deleting message:', error);
        }

        const { embed, row } = this.createInitialEmbed();
        await message.channel.send({ embeds: [embed], components: [row] });
    }

    async handleShowModal(interaction) {
        const member = await interaction.guild.members.fetch(interaction.user.id);
        const hasRole = await this.checkRolePermission(member);

        if (!hasRole) {
            return interaction.reply({ content: 'لا يمكنك استخدام هذه الميزة.', ephemeral: true });
        }

        const modal = this.createPageModal();
        await interaction.showModal(modal);
    }

    async handleShowIndex(interaction) {
        const member = await interaction.guild.members.fetch(interaction.user.id);
        const hasRole = await this.checkRolePermission(member);

        if (!hasRole) {
            return interaction.reply({ content: 'لا يمكنك استخدام هذه الميزة.', ephemeral: true });
        }

        const { embed } = this.createIndexEmbed();
        await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    async handleModalSubmit(interaction) {
        const member = await interaction.guild.members.fetch(interaction.user.id);
        const hasRole = await this.checkRolePermission(member);

        if (!hasRole) {
            return interaction.reply({ content: '❌️ | لا يمكنك استخدام هذه الميزة.', ephemeral: true });
        }

        const pageInput = interaction.fields.getTextInputValue('page_number');
        const page = parseInt(pageInput);

        if (isNaN(page) || page < 1 || page > this.totalPages) {
            return interaction.reply({ 
                content: `❌ | الرجاء إدخال رقم صحيح بين 1 و ${this.totalPages}!`, 
                ephemeral: true 
            });
        }

        this.setUserPage(interaction.user.id, page);
        const { embed, row } = this.createPageEmbed(interaction.user.id);

        await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    }

    async handleButtonInteraction(interaction) {
        const member = await interaction.guild.members.fetch(interaction.user.id);
        const hasRole = await this.checkRolePermission(member);

        if (!hasRole) {
            return interaction.reply({ content: '❌️ | لا يمكنك استخدام هذه الميزة.', ephemeral: true });
        }

        const userState = this.getUserState(interaction.user.id);
        let page = userState.currentPage;

        if (interaction.customId === 'quran_prev_page') {
            page--;
        } else if (interaction.customId === 'quran_next_page') {
            page++;
        }

        this.setUserPage(interaction.user.id, page);
        const { embed, row } = this.createPageEmbed(interaction.user.id);

        await interaction.update({ embeds: [embed], components: [row] });
    }
}

module.exports = QuranService;