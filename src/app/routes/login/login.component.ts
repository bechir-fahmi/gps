import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { LoginService } from '../../Services/login/login.service';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  providers: [MessageService]
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
    /**
   * Constructor for LoginComponent class.
   *
   * @param {FormBuilder} fb - FormBuilder instance to create the login form
   * @param {LoginService} loginService - LoginService instance for handling login operations
   * @param {Router} router - Router instance for navigation
   * @param {MessageService} messageService - MessageService instance for displaying messages
   */
  constructor(private fb: FormBuilder, private loginService: LoginService, private router: Router , private messageService: MessageService) {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
      rememberMe: [false]
    });
  }

  ngOnInit(): void { }
  /**
   * Submits the login form and performs the login operation.
   *
   * This function checks if the login form is invalid and marks all fields as touched.
   * If the form is invalid, the function returns early.
   *
   * If the form is valid, the function calls the `login` method of the `loginService`
   * with the form values. It subscribes to the returned observable and handles the
   * response in the `next` callback.
   *
   * If the response status is 200, it calls the `tokenGenerator` method of the
   * `loginService` and subscribes to the returned observable. In the `next` callback,
   * it sets the generated token in the local storage, logs the token, and navigates
   * to the '/map' route.
   *
   * If there is an error during the login or token generation, it logs the error.
   *
   * Finally, it logs the form submission values.
   *
   * @return {void} This function does not return anything.
   */
  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loginService.login(this.loginForm.value).subscribe({
      next: (response) => {
        if (response.status === 200) {
          this.loginService.tokenGenerator().subscribe({
            next: (res) => {
              localStorage.setItem('token', res.toString());
              console.log("Token generated", res);
              this.router.navigate(['/map']);
            },
            error: (err) => {
              console.error("Token generation error", err);
            }
          });
        }
      },
      error: (err) => {
        console.error('Login failed', err);
        this.messageService.add({ severity: 'error', summary: 'Login Failed', detail: 'Username or password is incorrect.' });
      },
      complete: () => {
        console.info('Login complete');
      }
    });

    console.log('Form Submitted', this.loginForm.value);
  }
}
