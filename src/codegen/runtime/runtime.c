#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdbool.h>

//
// ===============================
// INT → STRING
// ===============================
//
/*char* int_to_string(int x) {
    char buffer[32];
    snprintf(buffer, sizeof(buffer), "%d", x);

    char* res = (char*)malloc(strlen(buffer) + 1);
    strcpy(res, buffer);

    return res;
}
*/

char* int_to_string(int x) {
    char* res = (char*)malloc(2);

    res[0] = (char)x;
    res[1] = '\0';

    return res;
}

//
// ===============================
// DOUBLE → STRING
// ===============================
//
char* double_to_string(double x) {
    char buffer[64];
    snprintf(buffer, sizeof(buffer), "%f", x);

    char* res = (char*)malloc(strlen(buffer) + 1);
    strcpy(res, buffer);

    return res;
}

//
// ===============================
// BOOL → STRING
// ===============================
//
char* bool_to_string(bool x) {
    const char* str = x ? "true" : "false";

    char* res = (char*)malloc(strlen(str) + 1);
    strcpy(res, str);

    return res;
}

//
// ===============================
// STRING → INT
// ===============================
//

/*int string_to_int(char* str) {
    if (str == NULL) return 0;
    return atoi(str);
}
*/

int string_to_int(char* str) {
    if (str == NULL) return 0;

    // ASCII mode: first character only
    return (unsigned char)str[0];
}

//
// ===============================
// STRING → DOUBLE
// ===============================
//
double string_to_double(char* str) {
    if (str == NULL) return 0.0;
    return atof(str);
}

//
// ===============================
// STRING → BOOL
// ===============================
//
bool string_to_bool(char* str) {
    return (str != NULL && strlen(str) > 0);
}

//
// ===============================
// OPTIONAL: FREE STRING
// ===============================
//
void free_string(char* str) {
    if (str != NULL) {
        free(str);
    }
}

char* str_concat(const char* a, const char* b) {
    if (!a) a = "";
    if (!b) b = "";

    size_t len_a = strlen(a);
    size_t len_b = strlen(b);

    char* res = (char*)malloc(len_a + len_b + 1);
    if (!res) return NULL;

    memcpy(res, a, len_a);
    memcpy(res + len_a, b, len_b);
    res[len_a + len_b] = '\0';

    return res;
}

char* zen_char_to_string(char c) {
    char* s = (char*)malloc(2);
    s[0] = c;
    s[1] = '\0';
    return s;
}