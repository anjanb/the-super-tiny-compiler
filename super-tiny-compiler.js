
/**
 * Today we're going write a compiler together. But not just any compiler... A
 * super duper tiny teeny compiler! A compiler that is so small that if you
 * remove all the comments this file would only be ~200 lines of actual code.
 *
 * We're going to compile some lisp-like function calls into some C-like
 * function calls.
 *
 * If you are familiar with one or the other. I'll just give you a quick intro.
 *
 * If we had two functions `add` and `subtract` they would be written like this:
 *
 *                  LISP                      C
 *
 *   2 + 2          (add 2 2)                 add(2, 2)
 *   4 - 2          (subtract 4 2)            subtract(4, 2)
 *   2 + (4 - 2)    (add 2 (subtract 4 2))    add(2, subtract(4, 2))
 *
 * Easy peezy right?
 *
 * Well good, because this is exactly what we are going to compile. While this
 * is neither a complete LISP or C syntax, it will be enough of the syntax to
 * demonstrate many of the major pieces of a modern compiler.
 */

/**
 * Most compilers break down into three primary stages: Parsing, Transformation,
 * and Code Generation
 *
 * 1. *Parsing* is taking raw code and turning it into a more abstract
 *    representation of the code.
 *
 * 2. *Transformation* takes this abstract representation and manipulates to do
 *    whatever the compiler wants it to.
 *
 * 3. *Code Generation* takes the transformed representation of the code and
 *    turns it into new code.
 */

/**
 * Parsing
 * -------
 *
 * Parsing typically gets broken down into two phases: Lexical Analysis and
 * Syntactic Analysis.
 *
 * 1. *Lexical Analysis* takes the raw code and splits it apart into these things
 *    called tokens by a thing called a tokenizer (or lexer).
 *
 *    Tokens are an array of tiny little objects that describe an isolated piece
 *    of the syntax. They could be numbers, labels, punctuation, operators,
 *    whatever.
 *
 * 2. *Syntactic Analysis* takes the tokens and reformats them into a
 *    representation that describes each part of the syntax and their relation
 *    to one another. This is known as an intermediate representation or
 *    Abstract Syntax Tree.
 *
 *    An Abstract Syntax Tree, or AST for short, is a deeply nested object that
 *    represents code in a way that is both easy to work with and tells us a lot
 *    of information.
 *
 * For the following syntax:
 *
 *   (add 2 (subtract 4 2))
 *
 * Tokens might look something like this:
 *
 *   [
 *     { type: 'paren',  value: '('        },
 *     { type: 'name',   value: 'add'      },
 *     { type: 'number', value: '2'        },
 *     { type: 'paren',  value: '('        },
 *     { type: 'name',   value: 'subtract' },
 *     { type: 'number', value: '4'        },
 *     { type: 'number', value: '2'        },
 *     { type: 'paren',  value: ')'        },
 *     { type: 'paren',  value: ')'        }
 *   ]
 *
 * And an Abstract Syntax Tree (AST) might look like this:
 *
 *   {
 *     type: 'Program',
 *     body: [{
 *       type: 'CallExpression',
 *       name: 'add',
 *       params: [{
 *         type: 'NumberLiteral',
 *         value: '2'
 *       }, {
 *         type: 'CallExpression',
 *         name: 'subtract',
 *         params: [{
 *           type: 'NumberLiteral',
 *           value: '4'
 *         }, {
 *           type: 'NumberLiteral',
 *           value: '2'
 *         }]
 *       }]
 *     }]
 *   }
 */

/**
 * Transformation
 * --------------
 *
 * The next type of stage for a compiler is transformation. Again, this just
 * takes the AST from the last step and makes changes to it. It can manipulate
 * the AST in the same language or it can translate it into an entirely new
 * language.
 *
 * Let’s look at how we would transform an AST.
 *
 * You might notice that our AST has elements within it that look very similar.
 * There are these objects with a type property. Each of these are known as an
 * AST Node. These nodes have defined properties on them that describe one
 * isolated part of the tree.
 *
 * We can have a node for a "NumberLiteral":
 *
 *   {
 *     type: 'NumberLiteral',
 *     value: '2'
 *   }
 *
 * Or maybe a node for a "CallExpression":
 *
 *   {
 *     type: 'CallExpression',
 *     name: 'subtract',
 *     params: [...nested nodes go here...]
 *   }
 *
 * When transforming the AST we can manipulate nodes by
 * adding/removing/replacing properties, we can add new nodes, remove nodes, or
 * we could leave the existing AST alone and create and entirely new one based
 * on it.
 *
 * Since we’re targeting a new language, we’re going to focus on creating an
 * entirely new AST that is specific to the target language.
 *
 * Traversal
 * ---------
 *
 * In order to navigate through all of these nodes, we need to be able to
 * traverse through them. This traversal process goes to each node in the AST
 * depth-first.
 *
 *   {
 *     type: 'Program',
 *     body: [{
 *       type: 'CallExpression',
 *       name: 'add',
 *       params: [{
 *         type: 'NumberLiteral',
 *         value: '2'
 *       }, {
 *         type: 'CallExpression',
 *         name: 'subtract',
 *         params: [{
 *           type: 'NumberLiteral',
 *           value: '4'
 *         }, {
 *           type: 'NumberLiteral',
 *           value: '2'
 *         }]
 *       }]
 *     }]
 *   }
 *
 * So for the above AST we would go:
 *
 *   1. Program - Starting at the top level of the AST
 *   2. CallExpression (add) - Moving to the first element of the Program's body
 *   3. NumberLiteral (2) - Moving to the first element of CallExpression's params
 *   4. CallExpression (subtract) - Moving to the second element of CallExpression's params
 *   5. NumberLiteral (4) - Moving to the first element of CallExpression's params
 *   6. NumberLiteral (2) - Moving to the second element of CallExpression's params
 *
 * If we were manipulating this AST directly, instead of creating a separate AST,
 * we would likely introduce all sorts of abstractions here. But just visiting
 * each node in the tree is enough.
 *
 * The reason I use the word “visiting” is because there is this pattern of how
 * to represent operations on elements of an object structure.
 *
 * Visitors
 * --------
 *
 * The basic idea here is that we are going to create a “visitor” object that
 * has methods that will accept different node types.
 *
 *   var visitor = {
 *     NumberLiteral() {},
 *     CallExpression() {}
 *   };
 *
 * When we traverse our AST we will call the methods on this visitor whenever we
 * encounter a node of a matching type.
 *
 * In order to make this useful we will also pass the node and a reference to
 * the parent node.
 *
 *   var visitor = {
 *     NumberLiteral(node, parent) {},
 *     CallExpression(node, parent) {}
 *   };
 */

/**
 * Code Generation
 * ---------------
 *
 * The final phase of a compiler is code generation. Sometimes compilers will do
 * things that overlap with transformation, but for the most part code
 * generation just means take our AST and string-ify code back out.
 *
 * Code generators work several different ways, some compilers will reuse the
 * tokens from earlier, others will have created a separate representation of
 * the code so that they can print node linearly, but from what I can tell most
 * will use the same AST we just created, which is what we’re going to focus on.
 *
 * Effectively our code generator will know how to “print” all of the different
 * node types of the AST, and it will recursively call itself to print nested
 * nodes until everything is printed into one long string of code.
 */

/**
 * And that's it! That's all the different pieces of a compiler.
 *
 * Now that isn’t to say every compiler looks exactly like I described here.
 * Compilers serve many different purposes, and they might need more steps than
 * I have detailed.
 *
 * But now you should have a general high-level idea of what most compilers look
 * like.
 *
 * Now that I’ve explained all of this, you’re all good to go write your own
 * compilers right?
 *
 * Just kidding, that's what I'm here to help with :P
 *
 * So let's begin...
 */

 /**
  * ============================================================================
  *                                   (/^▽^)/
  *                                THE TOKENIZER!
  * ============================================================================
  */

/**
 * We're gonna start off with our first phase of parsing, lexical analysis, with
 * the tokenizer.
 *
 * We're just going to take our string of code and break it down into an array
 * of tokens.
 *
 *   (add 2 (subtract 4 2))   =>   [{ type: 'paren', value: '(' }, ...]
 */

// We start by accepting an input string of code, and we're gonna set up two
// things...
function tokenizer(input) {

  // A `current` variable for tracking our position in the code like a cursor.
  var current = 0;

  // And a `tokens` array for pushing our tokens to.
  var tokens = [];

  // We start by creating a `while` loop where we are setting up our `current`
  // variable to be incremented as much as we want `inside` the loop.
  //
  // We do this because we may want to increment `current` many times within a
  // single loop because our tokens can be any length.
  while (current < input.length) {

    // We're also going to store the `current` character in the `input`.
    var char = input[current];

    // The first thing we want to check for is an open parenthesis. This will
    // later be used for `CallExpressions` but for now we only care about the
    // character.
    //
    // We check to see if we have an open parenthesis:
    if (char === '(') {

      // If we do, we push a new token with the type `paren` and set the value
      // to an open parenthesis.
      tokens.push({
        type: 'paren',
        value: '('
      });

      // Then we increment `current`
      current++;

      // And we `continue` onto the next cycle of the loop.
      continue;
    }

    // Next we're going to check for a closing parenthesis. We do the same exact
    // thing as before: Check for a closing parenthesis, add a new token,
    // increment `current`, and `continue`.
    if (char === ')') {
      tokens.push({
        type: 'paren',
        value: ')'
      });
      current++;
      continue;
    }

    // Moving on, we're now going to check for whitespace. This is interesting
    // because we care that whitespace exists to separate characters, but it
    // isn't actually important for us to store as a token. We would only throw
    // it out later.
    //
    // So here we're just going to test for existance and if it does exist we're
    // going to just `continue` on.
    var WHITESPACE = /\s/;
    if (WHITESPACE.test(char)) {
      current++;
      continue;
    }

    // The next type of token is a number. This is different than what we have
    // seen before because a number could be any number of characters and we
    // want to capture the entire sequence of characters as one token.
    //
    //   (add 123 456)
    //        ^^^ ^^^
    //        Only two separate tokens
    //
    // So we start this off when we encounter the first number in a sequence.
    var NUMBERS = /[0-9]/;
    if (NUMBERS.test(char)) {

      // We're going to create a `value` string that we are going to push
      // characters to.
      var value = '';

      // Then we're going to loop through each character in the sequence until
      // we encounter a character that is not a number, pushing each character
      // that is a number to our `value` and incrementing `current` as we go.
      while (NUMBERS.test(char)) {
        value += char;
        char = input[++current];
      }

      // After that we push our `number` token to the `tokens` array.
      tokens.push({
        type: 'number',
        value: value
      });

      // And we continue on.
      continue;
    }

    // The last type of token will be a `name` token. This is a sequence of
    // letters instead of numbers, that are the names of functions in our lisp
    // syntax.
    //
    //   (add 2 4)
    //    ^^^
    //    Name token
    //
    var LETTERS = /[a-zA-Z]/;
    if (LETTERS.test(char)) {
      var value = '';

      // Again we're just going to loop through all the letters pushing them to
      // a value.
      while (LETTERS.test(char)) {
        value += char;
        char = input[++current];
      }

      // And pushing that value as a token with the type `name` and continuing.
      tokens.push({
        type: 'name',
        value: value
      });

      continue;
    }

    // Finally if we have not matched a character by now, we're going to throw
    // an error and completely exit.
    throw new TypeError('I dont know what this character is: ' + char);
  }

  // Then at the end of our `tokenizer` we simply return the tokens array.
  return tokens;
}

/**
 * ============================================================================
 *                                 ヽ/❀o ل͜ o\ﾉ
 *                                 THE PARSER!!!
 * ============================================================================
 */

/**
 * For our parser we're going to take our array of tokens and turn it into an
 * AST.
 *
 *   [{ type: 'paren', value: '(' }, ...]   =>   { type: 'Program', body: [...] }
 */

// Okay, so we define a `parser` function that accepts our array of `tokens`.
function parser(tokens) {

  // Again we keep a `current` variable that we will use as a cursor.
  var current = 0;

  // But this time we're going to use recursion instead of a `while` loop. So we
  // define a `walk` function.
  function walk() {

    // Inside the walk function we start by grabbing the `current` token.
    var token = tokens[current];

    // We're going to split each type of token off into a different code path,
    // starting off with `number` tokens.
    //
    // We test to see if we have a `number` token.
    if (token.type === 'number') {

      // If we have one, we'll increment `current`.
      current++;

      // And we'll return a new AST node called `NumberLiteral` and setting its
      // value to the value of our token.
      return {
        type: 'NumberLiteral',
        value: token.value
      };
    }

    // Next we're going to look for CallExpressions. We start this off when we
    // encounter an open parenthesis.
    if (
      token.type === 'paren' &&
      token.value === '('
    ) {

      // We'll increment `current` to skip the parenthesis since we don't care
      // about it in our AST.
      token = tokens[++current];

      // We create a base node with the type `CallExpression`, and we're going
      // to set the name as the current token's value since the next token after
      // the open parenthesis is the name of the function.
      var node = {
        type: 'CallExpression',
        name: token.value,
        params: []
      };

      // We increment `current` *again* to skip the name token.
      token = tokens[++current];

      // And now we want to loop through each token that will be the `params` of
      // our `CallExpression` until we encounter a closing parenthesis.
      //
      // Now this is where recursion comes in. Instead of trying to parse a
      // potentially infinitely nested set of nodes we're going to rely on
      // recursion to resolve things.
      //
      // To explain this, let's take our Lisp code. You can see that the
      // parameters of the `add` are a number and a nested `CallExpression` that
      // includes its own numbers.
      //
      //   (add 2 (subtract 4 2))
      //
      // You'll also notice that in our tokens array we have multiple closing
      // parenthesis.
      //
      //   [
      //     { type: 'paren',  value: '('        },
      //     { type: 'name',   value: 'add'      },
      //     { type: 'number', value: '2'        },
      //     { type: 'paren',  value: '('        },
      //     { type: 'name',   value: 'subtract' },
      //     { type: 'number', value: '4'        },
      //     { type: 'number', value: '2'        },
      //     { type: 'paren',  value: ')'        }, <<< Closing parenthesis
      //     { type: 'paren',  value: ')'        }  <<< Closing parenthesis
      //   ]
      //
      // We're going to rely on the nested `walk` function to increment our
      // `current` variable past any nested `CallExpressions`.

      // So we create a `while` loop that will continue until it encounters a
      // token with a `type` of `'paren'` and a `value` of a closing
      // parenthesis.
      while (
        token.type !== 'paren' ||
        token.value !== ')'
      ) {
        // we'll call the `walk` function which will return a `node` and we'll
        // push it into our `node.params`.
        node.params.push(walk());
        token = tokens[current];
      }

      // Finally we will increment `current` one last time to skip the closing
      // parenthesis.
      current++;

      // And return the node.
      return node;
    }

    // Again, if we haven't recognized the token type by now we're going to
    // throw an error.
    throw new TypeError(token.type);
  }

  // Now, we're going to create our AST which will have a root which is a
  // `Program` node.
  var ast = {
    type: 'Program',
    body: []
  };

  // And we're going to kickstart our `walk` function, pushing nodes to our
  // `ast.body` array.
  //
  // The reason we are doing this inside a loop is because our program can have
  // `CallExpressions` after one another instead of being nested.
  //
  //   (add 2 2)
  //   (subtract 4 2)
  //
  while (current < tokens.length) {
    ast.body.push(walk());
  }

  // At the end of our parser we'll return the AST.
  return ast;
}

/**
 * ============================================================================
 *                                 ⌒(❀>◞౪◟<❀)⌒
 *                               THE TRAVERSER!!!
 * ============================================================================
 */

/**
 * So now we have our AST, and we want to be able to visit different nodes with
 * a visitor. We need to be able to call the methods on the visitor whenever we
 * encounter a node with a matching type.
 *
 *   traverse(ast, {
 *     Program(node, parent) {
 *       // ...
 *     },
 *
 *     CallExpression(node, parent) {
 *       // ...
 *     },
 *
 *     NumberLiteral(node, parent) {
 *       // ...
 *     }
 *   });
 */

// So we define a <code>traverser</code> function which accepts an AST and a
// visitor. Inside we're going to define two functions...
function traverser(ast, visitor) {

  // A `traverseArray` function that will allow us to iterate over an array and
  // call the next function that we will define: `traverseNode`.
  function traverseArray(array, parent) {
    array.forEach(function(child) {
      traverseNode(child, parent);
    });
  }

  // `traverseNode` will accept a `node` and its `parent` node. So that it can
  // pass both to our visitor methods.
  function traverseNode(node, parent) {

    // We start by testing for the existance of a method on the visitor with a
    // matching `type`.
    var method = visitor[node.type];

    // If it exists we'll call it with the `node` and its `parent`.
    if (method) {
      method(node, parent);
    }

    // Next we are going to split things up by the current node type.
    switch (node.type) {

      // We'll start with our top level `Program`. Since Program nodes have a
      // property named body that has an array of nodes, we will call
      // `traverseArray` to traverse down into them.
      //
      // (Remember that `traverseArray` will in turn call `traverseNode` so  we
      // are causing the tree to be traversed recursively)
      case 'Program':
        traverseArray(node.body, node);
        break;

      // Next we do the same will `CallExpressions` and traverse their `params`.
      case 'CallExpression':
        traverseArray(node.params, node);
        break;

      // In the case of `NumberLiterals` we don't have any child nodes to visit,
      // so we'll just break.
      case 'NumberLiteral':
        break;

      // And again, if we haven't recognized the node type then we'll throw an
      // error.
      default:
        throw new TypeError(node.type);
    }
  }

  // Finally we kickstart the traverser by calling `traverseNode` with our ast
  // with no `parent` because the top level of the AST doesn't have a parent.
  traverseNode(ast, null);
}

/**
 * ----------------------------------------------------------------------------
 * *Note:* This is all I've written so far, so the code below isn't annnotated
 * yet. You can still read it all and it totally works, but I plan on improving
 * this in the near future
 * ----------------------------------------------------------------------------
 */

/**
 * ============================================================================
 *                                 ⁽(◍˃̵͈̑ᴗ˂̵͈̑)⁽
 *                              THE TRANSFORMER!!!
 * ============================================================================
 */

function transformer(ast) {
  var newAst = {
    type: 'Program',
    body: []
  };

  ast._context = newAst.body;

  traverser(ast, {
    NumberLiteral: function(node, parent) {
      parent._context.push({
        type: 'NumberLiteral',
        value: node.value
      });
    },

    CallExpression: function(node, parent) {
      var expression = {
        type: 'CallExpression',
        callee: {
          type: 'Identifier',
          name: node.name
        },
        arguments: []
      };

      node._context = expression.arguments;

      if (parent.type !== 'CallExpression') {
        expression = {
          type: 'ExpressionStatement',
          expression: expression
        };
      }

      parent._context.push(expression);
    }
  });

  return newAst;
}

/**
 * ============================================================================
 *                                ヾ（〃＾∇＾）ﾉ♪
 *                            THE CODE GENERATOR!!!!
 * ============================================================================
 */

function codeGenerator(node) {
  switch (node.type) {
    case 'Program':
      return node.body.map(codeGenerator)
        .join('\n');

    case 'ExpressionStatement':
      return (
        codeGenerator(node.expression) +
        ';'
      );

    case 'CallExpression':
      return (
        codeGenerator(node.callee) +
        '(' +
        node.arguments.map(codeGenerator)
          .join(', ') +
        ')'
      );

    case 'Identifier':
      return node.name;

    case 'NumberLiteral':
      return node.value;

    default:
      throw new TypeError(node.type);
  }
}

/**
 * ============================================================================
 *                                 (۶* ‘ヮ’)۶”
 *                        !!!!!!!!THE COMPILER!!!!!!!!
 * ============================================================================
 */

function compiler(input) {
  var tokens = tokenizer(input);
  var ast    = parser(tokens);
  var newAst = transformer(ast);
  var output = codeGenerator(newAst);

  return output;
}


/**
 * ============================================================================
 *                                   (๑˃̵ᴗ˂̵)و
 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!YOU MADE IT!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
 * ============================================================================
 */

// Now I'm just exporting everything...
module.exports = {
  tokenizer: tokenizer,
  parser: parser,
  transformer: transformer,
  codeGenerator: codeGenerator,
  compiler: compiler
};
